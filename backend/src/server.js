import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { kpis } from "./data/demo-data.js";
import { demoUserMiddleware } from "./lib/auth.js";
import { parseListing } from "./lib/nlp.js";
import { assertCanUpdate } from "./lib/rbac.js";
import { planRoute } from "./lib/route-planner.js";
import { errorHandler } from "./middleware/error-handler.js";
import { login, register } from "./lib/auth-api.js";
import { getDatabase } from "./config/mongodb.js";
import { requireAuth } from "./lib/auth-api.js";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json());
app.use(morgan("tiny"));
app.use(demoUserMiddleware);

app.get("/health", (request, response) => {
  response.json({ ok: true, service: "directagri-api" });
});

app.post("/api/auth/signup", register);
app.post("/api/auth/login", login);

app.get("/api/crop-batches", requireAuth, async (request, response, next) => {
  try {
    const batches = await (await getDatabase()).collection("cropBatches").find({ status: { $ne: "SOLD" } }).sort({ createdAt: -1 }).toArray();
    response.json({ batches: batches.map(toBatchResponse) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/crop-batches", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "farmer") return response.status(403).json({ error: "Only farmers can create crop listings." });
    const body = z
      .object({
        text: z.string().optional(),
        cropType: z.string().optional(),
        quantityKg: z.number().int().positive().optional(),
        pricePerKg: z.number().positive().optional()
      })
      .parse(request.body);
    const parsed = body.text ? parseListing(body.text) : {};
    const batch = {
      ownerId: request.authUser.id,
      farmer: request.authUser.name,
      crop: body.cropType ?? parsed.crop ?? "Mixed Produce",
      village: request.user.location.split(",")[0],
      district: request.user.location.split(",")[1]?.trim() ?? "Nashik",
      quantityKg: body.quantityKg ?? parsed.quantityKg ?? 500,
      pricePerKg: body.pricePerKg ?? parsed.pricePerKg ?? 25,
      status: "ON_FARM",
      quality: 86
    };

    const result = await (await getDatabase()).collection("cropBatches").insertOne({ ...batch, createdAt: new Date() });
    const savedBatch = { ...batch, _id: result.insertedId };
    await recordAudit("CROP_BATCH_CREATED", result.insertedId.toString(), request.authUser);
    response.status(201).json({ batch: toBatchResponse(savedBatch), audit: `${request.authUser.role} created crop batch ${result.insertedId}` });
  } catch (error) {
    next(error);
  }
});

function toBatchResponse(batch) {
  return {
    id: batch._id?.toString() ?? batch.id,
    ownerId: batch.ownerId,
    farmer: batch.farmer,
    crop: batch.crop,
    village: batch.village,
    district: batch.district,
    quantityKg: batch.quantityKg,
    pricePerKg: batch.pricePerKg,
    status: batch.status,
    quality: batch.quality,
    lat: batch.lat,
    lng: batch.lng
  };
}

async function recordAudit(action, entityId, user) {
  const database = await getDatabase();
  await database.collection("auditLogs").insertOne({ actorId: user.id, actorName: user.name, actorRole: user.role, action, entityId, createdAt: new Date() });
}

app.patch("/api/crop-batches/:id", (request, response, next) => {
  try {
    const fields = Object.keys(request.body);
    assertCanUpdate(request.user.role, fields);
    response.json({
      id: request.params.id,
      updates: request.body,
      audit: `${request.user.role} updated ${fields.join(", ")} on ${request.params.id}`
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/nlp-parse", (request, response, next) => {
  try {
    const body = z.object({ text: z.string().min(1) }).parse(request.body);
    response.json(parseListing(body.text));
  } catch (error) {
    next(error);
  }
});

app.get("/api/forecast", async (request, response, next) => {
  try {
    const benchmarks = await (await getDatabase()).collection("priceBenchmarks").find().sort({ recordedAt: -1 }).toArray();
    response.json({ forecast: benchmarks.map((item) => ({ crop: item.cropType, demand: item.demand ?? 0, mandi: item.mandiPrice, platform: item.platformAvg })), advisory: "Onion and pomegranate show the strongest demand-price signal for the next procurement cycle." });
  } catch (error) {
    next(error);
  }
});

app.get("/api/route-optimize", requireAuth, async (request, response, next) => {
  try {
    const batches = await (await getDatabase()).collection("cropBatches").find({ status: { $ne: "SOLD" } }).toArray();
    response.json({
      route: planRoute(batches.map(toBatchResponse)).map((batch, index) => ({
        stop: index + 1,
        batchId: batch.id,
        village: batch.village,
        crop: batch.crop
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders", requireAuth, async (request, response, next) => {
  try {
    const orders = await (await getDatabase()).collection("orders").find({ buyerId: request.authUser.id }).sort({ createdAt: -1 }).toArray();
    response.json({ orders: orders.map((order) => ({ ...order, id: order._id.toString(), _id: undefined })) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/available", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "transporter") return response.status(403).json({ error: "Only transporters can view delivery gigs." });
    const orders = await (await getDatabase()).collection("orders").find({ transporterId: null, escrowStatus: "LOCKED" }).sort({ createdAt: 1 }).limit(10).toArray();
    response.json({ orders: orders.map((order) => ({ ...order, id: order._id.toString(), _id: undefined })) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/:id/assign-transporter", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "transporter") return response.status(403).json({ error: "Only transporters can accept delivery gigs." });
    if (!ObjectId.isValid(request.params.id)) return response.status(400).json({ error: "Invalid order id." });
    const database = await getDatabase();
    const result = await database.collection("orders").findOneAndUpdate({ _id: new ObjectId(request.params.id), transporterId: null }, { $set: { transporterId: request.authUser.id, transporter: request.authUser.name, status: "TRANSPORT_ASSIGNED" } }, { returnDocument: "after" });
    if (!result) return response.status(404).json({ error: "Order is unavailable or already assigned." });
    await recordAudit("TRANSPORTER_ASSIGNED", request.params.id, request.authUser);
    response.json({ order: { ...result, id: result._id.toString(), _id: undefined } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/aggregate", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "buyer") return response.status(403).json({ error: "Only buyers can create orders." });
    const body = z.object({ batchIds: z.array(z.string()).min(1), transporterId: z.string().optional() }).parse(request.body);
    const batchObjectIds = body.batchIds.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const savedItems = await (await getDatabase()).collection("cropBatches").find({ _id: { $in: batchObjectIds }, status: { $ne: "SOLD" } }).toArray();
    const items = savedItems.map(toBatchResponse);
    if (!items.length) return response.status(404).json({ error: "No available crop batches were found." });
    const value = items.reduce((sum, batch) => sum + batch.quantityKg * batch.pricePerKg, 0);
    const database = await getDatabase();
    const order = { buyerId: request.authUser.id, buyer: request.authUser.name, transporterId: body.transporterId ?? null, escrowStatus: "LOCKED", value, createdAt: new Date() };
    const result = await database.collection("orders").insertOne(order);
    await database.collection("orderItems").insertMany(items.map((item) => ({ orderId: result.insertedId.toString(), batchId: item.id, quantityKg: item.quantityKg })));
    await recordAudit("ORDER_CREATED", result.insertedId.toString(), request.authUser);
    response.status(201).json({ order: { ...order, id: result.insertedId.toString(), items }, payments: [] });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/:id/release", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "buyer") return response.status(403).json({ error: "Only the buyer can release escrow." });
    if (!ObjectId.isValid(request.params.id)) return response.status(400).json({ error: "Invalid order id." });
    const database = await getDatabase();
    const order = await database.collection("orders").findOneAndUpdate({ _id: new ObjectId(request.params.id), buyerId: request.authUser.id, escrowStatus: "LOCKED" }, { $set: { escrowStatus: "RELEASED", status: "COMPLETED", releasedAt: new Date() } }, { returnDocument: "after" });
    if (!order) return response.status(404).json({ error: "Locked order was not found." });
    const payments = [
      { orderId: request.params.id, payerId: request.authUser.id, type: "FARMER_PAYOUT", amount: Math.round(order.value * 0.86), status: "RELEASED" },
      { orderId: request.params.id, payerId: request.authUser.id, type: "TRANSPORT_FEE", amount: Math.round(order.value * 0.1), status: "RELEASED" },
      { orderId: request.params.id, payerId: request.authUser.id, type: "STORAGE_RENT", amount: Math.round(order.value * 0.04), status: "RELEASED" }
    ];
    await database.collection("payments").insertMany(payments);
    await recordAudit("ESCROW_RELEASED", request.params.id, request.authUser);
    response.json({ order: { ...order, id: order._id.toString(), _id: undefined }, payments });
  } catch (error) {
    next(error);
  }
});

app.get("/api/orders/bids", requireAuth, async (request, response, next) => {
  try {
    const bids = await (await getDatabase()).collection("bids").find({ buyerId: request.authUser.id }).sort({ createdAt: -1 }).toArray();
    response.json({ bids: bids.map((bid) => ({ ...bid, id: bid._id.toString(), _id: undefined })) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/orders/bids", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "buyer") return response.status(403).json({ error: "Only buyers can submit bids." });
    const body = z.object({ batchId: z.string(), offerPrice: z.number().positive() }).parse(request.body);
    const bid = { batchId: body.batchId, buyerId: request.authUser.id, buyer: request.authUser.name, offerPrice: body.offerPrice, status: "PENDING", createdAt: new Date() };
    const result = await (await getDatabase()).collection("bids").insertOne(bid);
    await recordAudit("BID_SUBMITTED", result.insertedId.toString(), request.authUser);
    response.status(201).json({ bid: { ...bid, id: result.insertedId.toString() } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/storage/checkin", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "storage") return response.status(403).json({ error: "Only storage partners can check in batches." });
    const body = z
      .object({
        batchId: z.string(),
        dailyRentPerKg: z.number().positive().default(0.42),
        qualityScore: z.number().int().min(0).max(100).default(85),
        photoUrl: z.string().default("/demo/checkin.jpg")
      })
      .parse(request.body);

    if (!ObjectId.isValid(body.batchId)) return response.status(400).json({ error: "Invalid crop batch id." });
    const database = await getDatabase();
    const batchId = new ObjectId(body.batchId);
    const updatedBatch = await database.collection("cropBatches").findOneAndUpdate({ _id: batchId }, { $set: { status: "STORED", storageId: request.authUser.id } }, { returnDocument: "after" });
    if (!updatedBatch) return response.status(404).json({ error: "Crop batch was not found." });
    const ledger = { batchId: body.batchId, storageId: request.authUser.id, storagePartner: request.authUser.name, dailyRentPerKg: body.dailyRentPerKg, checkInDate: new Date(), checkOutDate: null };
    await database.collection("storageLedger").insertOne(ledger);
    const qualityCheck = { batchId: body.batchId, checkedBy: request.authUser.id, checkedByName: request.authUser.name, stage: "STORAGE_CHECKIN", photoUrl: body.photoUrl, score: body.qualityScore, createdAt: new Date() };
    await database.collection("qualityChecks").insertOne(qualityCheck);
    await recordAudit("STORAGE_CHECKIN", body.batchId, request.authUser);
    response.status(201).json({ batch: { id: body.batchId, status: "STORED", storagePartner: request.authUser.name }, ledger, qualityCheck: { ...qualityCheck, id: qualityCheck._id?.toString() } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/storage/checkout", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "storage") return response.status(403).json({ error: "Only storage partners can check out batches." });
    const body = z
      .object({
        batchId: z.string(),
        qualityScore: z.number().int().min(0).max(100).default(85),
        photoUrl: z.string().default("/demo/checkout.jpg")
      })
      .parse(request.body);

    if (!ObjectId.isValid(body.batchId)) return response.status(400).json({ error: "Invalid crop batch id." });
    const database = await getDatabase();
    const batchId = new ObjectId(body.batchId);
    const updatedBatch = await database.collection("cropBatches").findOneAndUpdate({ _id: batchId }, { $set: { status: "IN_TRANSIT" } }, { returnDocument: "after" });
    if (!updatedBatch) return response.status(404).json({ error: "Crop batch was not found." });
    const checkOutDate = new Date();
    const ledger = await database.collection("storageLedger").findOneAndUpdate({ batchId: body.batchId, checkOutDate: null }, { $set: { checkOutDate } }, { sort: { checkInDate: -1 }, returnDocument: "after" });
    const qualityCheck = { batchId: body.batchId, checkedBy: request.authUser.id, checkedByName: request.authUser.name, stage: "STORAGE_CHECKOUT", photoUrl: body.photoUrl, score: body.qualityScore, createdAt: checkOutDate };
    await database.collection("qualityChecks").insertOne(qualityCheck);
    await recordAudit("STORAGE_CHECKOUT", body.batchId, request.authUser);
    response.status(201).json({ batch: { id: body.batchId, status: "IN_TRANSIT" }, ledger: ledger ?? { batchId: body.batchId, checkOutDate }, qualityCheck: { ...qualityCheck, id: qualityCheck._id?.toString() } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/quality", requireAuth, async (request, response, next) => {
  try {
    const qualityChecks = await (await getDatabase()).collection("qualityChecks").find().sort({ createdAt: -1 }).toArray();
    response.json({ qualityChecks: qualityChecks.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) });
  } catch (error) {
    next(error);
  }
});

app.post("/api/quality", requireAuth, async (request, response, next) => {
  try {
    const body = z
      .object({
        batchId: z.string(),
        stage: z.enum(["STORAGE_CHECKIN", "STORAGE_CHECKOUT", "DELIVERY"]),
        photoUrl: z.string().default("/demo/quality.jpg"),
        score: z.number().int().min(0).max(100).optional()
      })
      .parse(request.body);
    const qualityCheck = { batchId: body.batchId, checkedBy: request.authUser.id, checkedByName: request.authUser.name, stage: body.stage, photoUrl: body.photoUrl, score: body.score ?? Math.floor(78 + Math.random() * 18), createdAt: new Date() };
    const result = await (await getDatabase()).collection("qualityChecks").insertOne(qualityCheck);
    await recordAudit("QUALITY_CHECK_RECORDED", body.batchId, request.authUser);
    response.status(201).json({ qualityCheck: { ...qualityCheck, id: result.insertedId.toString() } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/government/stats", requireAuth, async (request, response, next) => {
  try {
    const database = await getDatabase();
    const [verifiedParticipants, activeBatches, openDisputes, districts] = await Promise.all([
      database.collection("users").countDocuments({ kycVerified: true }),
      database.collection("cropBatches").countDocuments({ status: { $ne: "SOLD" } }),
      database.collection("disputes").countDocuments({ status: "OPEN" }),
      database.collection("cropBatches").distinct("district")
    ]);
    const auditEvents = await database.collection("auditLogs").countDocuments();
    response.json({ kpis, adoption: { verifiedParticipants, districtsCovered: districts.length, activeBatches, openDisputes, auditEvents } });
  } catch (error) {
    next(error);
  }
});

app.get("/api/government/audit-log", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "government") return response.status(403).json({ error: "Only government users can view audit logs." });
    const auditLogs = await (await getDatabase()).collection("auditLogs").find().sort({ createdAt: -1 }).limit(50).toArray();
    response.json({ auditLogs: auditLogs.map((item) => ({ ...item, id: item._id.toString(), _id: undefined })) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/government/price-benchmark", requireAuth, async (request, response, next) => {
  try {
    const benchmarks = await (await getDatabase()).collection("priceBenchmarks").find().sort({ recordedAt: -1 }).toArray();
    response.json({
      benchmarks: benchmarks.map((item) => ({
        cropType: item.cropType,
        mandiPrice: item.mandiPrice,
        platformAvg: item.platformAvg,
        upliftPercent: Math.round(((item.platformAvg - item.mandiPrice) / item.mandiPrice) * 1000) / 10
      }))
    });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(port, () => {
  console.log(`DirectAgri API listening on ${port}`);
});
