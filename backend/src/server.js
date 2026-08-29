import "dotenv/config";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { parseListing } from "./lib/nlp.js";
import { assertCanUpdate } from "./lib/rbac.js";
import { planRoute } from "./lib/route-planner.js";
import { errorHandler } from "./middleware/error-handler.js";
import { forgotPassword, login, register, resetPassword } from "./lib/auth-api.js";
import { getDatabase, isMemoryStore } from "./config/mongodb.js";
import { requireAuth } from "./lib/auth-api.js";

function unwrapDocument(result) {
  if (result == null) return null;
  if (Object.prototype.hasOwnProperty.call(result, "lastErrorObject") && Object.prototype.hasOwnProperty.call(result, "value")) {
    return result.value ?? null;
  }
  return result;
}

function locationParts(user) {
  const location = user?.location ?? "Pimpalgaon, Nashik";
  const [village, district] = String(location).split(",").map((part) => part.trim());
  return { village: village || "Pimpalgaon", district: district || "Nashik" };
}

const app = express();
const port = process.env.PORT ?? 4000;

app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000" }));
app.use(express.json({ limit: "6mb" }));
app.use(morgan("tiny"));
app.get("/health", async (request, response, next) => {
  try {
    await getDatabase();
    response.json({ ok: true, service: "directagri-api", store: isMemoryStore() ? "memory" : "mongodb" });
  } catch (error) {
    next(error);
  }
});

app.post("/api/auth/signup", register);
app.post("/api/auth/login", login);
app.post("/api/auth/forgot-password", forgotPassword);
app.post("/api/auth/reset-password", resetPassword);

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
        pricePerKg: z.number().positive().optional(),
        listingIntent: z.enum(["sell", "store"]).optional().default("sell"),
        storagePartnerId: z.string().optional(),
        vehicleMode: z.enum(["transport-partner", "own-vehicle"]).optional(),
        estimatedDistanceKm: z.number().nonnegative().optional(),
        estimatedFare: z.number().nonnegative().optional()
      })
      .parse(request.body);
    const parsed = body.text ? await parseListing(body.text) : {};
    const { village, district } = locationParts(request.authUser);
    const storagePartner = body.listingIntent === "store" ? findStoragePartner(body.storagePartnerId) : null;
    const batch = {
      ownerId: request.authUser.id,
      farmer: request.authUser.name,
      crop: body.cropType ?? parsed.crop ?? "Mixed Produce",
      village,
      district,
      quantityKg: body.quantityKg ?? parsed.quantityKg ?? 500,
      pricePerKg: body.pricePerKg ?? parsed.pricePerKg ?? 25,
      status: "ON_FARM",
      listingIntent: body.listingIntent === "store" ? "STORE" : "SELL",
      storagePartnerId: storagePartner?.id ?? null,
      storagePartnerName: storagePartner ? `${storagePartner.name} · ${storagePartner.city}` : null,
      vehicleMode: body.listingIntent === "store" ? (body.vehicleMode ?? "transport-partner") : null,
      estimatedDistanceKm: body.listingIntent === "store" ? (body.estimatedDistanceKm ?? 0) : 0,
      estimatedFare: body.listingIntent === "store" ? (body.estimatedFare ?? 0) : 0,
      quality: 86,
      lat: storagePartner?.lat ?? 20.05 + Math.random() / 6,
      lng: storagePartner?.lng ?? 73.9 + Math.random() / 5
    };

    const batchNumber = makeBatchNumber(Date.now());
    const result = await (await getDatabase()).collection("cropBatches").insertOne({ ...batch, batchNumber, createdAt: new Date() });
    const savedBatch = { ...batch, _id: result.insertedId, batchNumber };
    await recordAudit("CROP_BATCH_CREATED", result.insertedId.toString(), request.authUser);
    response.status(201).json({ batch: toBatchResponse(savedBatch), audit: `${request.authUser.role} created crop batch ${savedBatch.batchNumber}` });
  } catch (error) {
    next(error);
  }
});

function makeBatchNumber(seed) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const raw = String(seed ?? Date.now());
  const numericSeed = [...raw].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const letterIndex = numericSeed % alphabet.length;
  const numberPart = String((numericSeed * 13) % 900 + 100).padStart(3, "0");
  return `${alphabet[letterIndex]}${numberPart}`;
}

const STORAGE_PARTNERS = [
  { id: "greenharvest", name: "GreenHarvest Cold Storage", city: "Nashik", lat: 20.01, lng: 73.78 },
  { id: "safegrow", name: "SafeGrow Warehousing", city: "Malegaon", lat: 20.55, lng: 74.52 },
  { id: "grainlink", name: "GrainLink Logistics Hub", city: "Pune", lat: 18.52, lng: 73.85 }
];

function findStoragePartner(id) {
  return STORAGE_PARTNERS.find((partner) => partner.id === id) ?? STORAGE_PARTNERS[0];
}

function toBatchResponse(batch) {
  const batchId = batch._id?.toString() ?? batch.id ?? batch.batchNumber ?? "";
  return {
    id: batchId,
    batchNumber: batch.batchNumber ?? makeBatchNumber(batchId),
    ownerId: batch.ownerId,
    farmer: batch.farmer,
    crop: batch.crop,
    village: batch.village,
    district: batch.district,
    quantityKg: batch.quantityKg,
    pricePerKg: batch.pricePerKg,
    status: batch.status,
    listingIntent: batch.listingIntent ?? "SELL",
    storagePartnerId: batch.storagePartnerId ?? null,
    storagePartnerName: batch.storagePartnerName ?? null,
    vehicleMode: batch.vehicleMode ?? null,
    estimatedDistanceKm: batch.estimatedDistanceKm ?? 0,
    estimatedFare: batch.estimatedFare ?? 0,
    quality: batch.quality,
    lat: batch.lat,
    lng: batch.lng
  };
}

async function recordAudit(action, entityId, user) {
  const database = await getDatabase();
  await database.collection("auditLogs").insertOne({ actorId: user.id, actorName: user.name, actorRole: user.role, action, entityId, createdAt: new Date() });
}

app.patch("/api/crop-batches/:id", requireAuth, async (request, response, next) => {
  try {
    const fields = Object.keys(request.body ?? {});
    assertCanUpdate(request.authUser.role, fields);
    if (!ObjectId.isValid(request.params.id)) return response.status(400).json({ error: "Invalid crop batch id." });
    const updated = unwrapDocument(await (await getDatabase()).collection("cropBatches").findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      { $set: request.body },
      { returnDocument: "after" }
    ));
    if (!updated) return response.status(404).json({ error: "Crop batch was not found." });
    await recordAudit("CROP_BATCH_UPDATED", request.params.id, request.authUser);
    response.json({
      batch: toBatchResponse(updated),
      audit: `${request.authUser.role} updated ${fields.join(", ")} on ${request.params.id}`
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/nlp-parse", async (request, response, next) => {
  try {
    const body = z.object({ text: z.string().min(1) }).parse(request.body);
    response.json(await parseListing(body.text));
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
    const result = unwrapDocument(await database.collection("orders").findOneAndUpdate({ _id: new ObjectId(request.params.id), transporterId: null }, { $set: { transporterId: request.authUser.id, transporter: request.authUser.name, status: "TRANSPORT_ASSIGNED" } }, { returnDocument: "after" }));
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
    const order = unwrapDocument(await database.collection("orders").findOneAndUpdate({ _id: new ObjectId(request.params.id), buyerId: request.authUser.id, escrowStatus: "LOCKED" }, { $set: { escrowStatus: "RELEASED", status: "COMPLETED", releasedAt: new Date() } }, { returnDocument: "after" }));
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

app.get("/api/bids/received", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "farmer") return response.status(403).json({ error: "Only farmers can view incoming bids." });
    const database = await getDatabase();
    const bids = await database.collection("bids").find({}).sort({ createdAt: -1 }).toArray();
    const batchIds = bids.map((bid) => bid.batchId).filter(Boolean).filter((id) => ObjectId.isValid(id));
    const batches = batchIds.length ? await database.collection("cropBatches").find({ _id: { $in: batchIds.map((id) => new ObjectId(id)) } }).toArray() : [];
    const batchMap = new Map(batches.map((batch) => [batch._id.toString(), toBatchResponse(batch)]));
    response.json({
      bids: bids
        .filter((bid) => batchMap.has(String(bid.batchId)))
        .map((bid) => ({
          ...bid,
          id: bid._id.toString(),
          _id: undefined,
          batch: batchMap.get(String(bid.batchId))
        }))
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bids/:id/accept", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "farmer") return response.status(403).json({ error: "Only farmers can accept bids." });
    if (!ObjectId.isValid(request.params.id)) return response.status(400).json({ error: "Invalid bid id." });
    const database = await getDatabase();
    const updatedBid = unwrapDocument(await database.collection("bids").findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      { $set: { status: "ACCEPTED", acceptedAt: new Date() } },
      { returnDocument: "after" }
    ));
    if (!updatedBid) return response.status(404).json({ error: "Bid was not found." });
    await recordAudit("BID_ACCEPTED", request.params.id, request.authUser);
    response.json({ bid: { ...updatedBid, id: updatedBid._id.toString(), _id: undefined } });
  } catch (error) {
    next(error);
  }
});

app.post("/api/bids/:id/reject", requireAuth, async (request, response, next) => {
  try {
    if (request.authUser.role !== "farmer") return response.status(403).json({ error: "Only farmers can reject bids." });
    if (!ObjectId.isValid(request.params.id)) return response.status(400).json({ error: "Invalid bid id." });
    const database = await getDatabase();
    const updatedBid = unwrapDocument(await database.collection("bids").findOneAndUpdate(
      { _id: new ObjectId(request.params.id) },
      { $set: { status: "REJECTED", rejectedAt: new Date() } },
      { returnDocument: "after" }
    ));
    if (!updatedBid) return response.status(404).json({ error: "Bid was not found." });
    await recordAudit("BID_REJECTED", request.params.id, request.authUser);
    response.json({ bid: { ...updatedBid, id: updatedBid._id.toString(), _id: undefined } });
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
    const updatedBatch = unwrapDocument(await database.collection("cropBatches").findOneAndUpdate({ _id: batchId }, { $set: { status: "STORED", storageId: request.authUser.id, quality: body.qualityScore } }, { returnDocument: "after" }));
    if (!updatedBatch) return response.status(404).json({ error: "Crop batch was not found." });
    const ledger = { batchId: body.batchId, storageId: request.authUser.id, storagePartner: request.authUser.name, dailyRentPerKg: body.dailyRentPerKg, checkInDate: new Date(), checkOutDate: null };
    await database.collection("storageLedger").insertOne(ledger);
    const qualityCheck = { batchId: body.batchId, checkedBy: request.authUser.id, checkedByName: request.authUser.name, stage: "STORAGE_CHECKIN", photoUrl: body.photoUrl, score: body.qualityScore, createdAt: new Date() };
    await database.collection("qualityChecks").insertOne(qualityCheck);
    await recordAudit("STORAGE_CHECKIN", body.batchId, request.authUser);
    response.status(201).json({ batch: { ...toBatchResponse(updatedBatch), storagePartner: request.authUser.name }, ledger, qualityCheck: { ...qualityCheck, id: qualityCheck._id?.toString() } });
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
    const updatedBatch = unwrapDocument(await database.collection("cropBatches").findOneAndUpdate({ _id: batchId }, { $set: { status: "IN_TRANSIT", quality: body.qualityScore } }, { returnDocument: "after" }));
    if (!updatedBatch) return response.status(404).json({ error: "Crop batch was not found." });
    const checkOutDate = new Date();
    const ledger = unwrapDocument(await database.collection("storageLedger").findOneAndUpdate({ batchId: body.batchId, checkOutDate: null }, { $set: { checkOutDate } }, { sort: { checkInDate: -1 }, returnDocument: "after" }));
    const qualityCheck = { batchId: body.batchId, checkedBy: request.authUser.id, checkedByName: request.authUser.name, stage: "STORAGE_CHECKOUT", photoUrl: body.photoUrl, score: body.qualityScore, createdAt: checkOutDate };
    await database.collection("qualityChecks").insertOne(qualityCheck);
    await recordAudit("STORAGE_CHECKOUT", body.batchId, request.authUser);
    response.status(201).json({ batch: toBatchResponse(updatedBatch), ledger: ledger ?? { batchId: body.batchId, checkOutDate }, qualityCheck: { ...qualityCheck, id: qualityCheck._id?.toString() } });
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
    response.json({
      kpis: [
        { label: "Verified participants", value: String(verifiedParticipants) },
        { label: "Active crop batches", value: String(activeBatches) },
        { label: "Districts covered", value: String(districts.length) },
        { label: "Audit events", value: String(auditEvents) }
      ],
      adoption: { verifiedParticipants, districtsCovered: districts.length, activeBatches, openDisputes, auditEvents }
    });
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

export { app };

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const server = app.listen(port, () => {
    console.log(`DirectAgri API listening on ${port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the existing process or change PORT in backend/.env.`);
      process.exit(1);
    }
    console.error("Server startup error:", error);
    process.exit(1);
  });
}
