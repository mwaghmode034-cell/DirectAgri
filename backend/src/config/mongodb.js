import { MongoClient } from "mongodb";
import { demoBatches, forecast } from "../data/demo-data.js";

let client;
let database;

export async function getDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not configured");
    if (!database) {
        try {
            client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
            await client.connect();
            database = client.db(process.env.MONGODB_DB ?? "directagri");
            await ensureCollections(database);
            await seedDemoCollections(database);
        } catch (error) {
            await client?.close().catch(() => { });
            client = undefined;
            database = undefined;
            const errorText = `${error.codeName ?? ""} ${error.message ?? ""}`.toLowerCase();
            if (error.code === 18 || error.code === 8000 || errorText.includes("bad auth") || errorText.includes("authentication failed") || errorText.includes("authenticationfailure")) {
                const authError = new Error("MongoDB authentication failed. Check the Atlas database username, password, and URL encoding.");
                authError.status = 503;
                throw authError;
            }
            throw error;
        }
    }
    return database;
}

async function ensureCollections(database) {
    const indexes = {
        users: [[{ email: 1 }, { unique: true }]],
        cropBatches: [[{ ownerId: 1, status: 1 }]],
        orders: [[{ buyerId: 1, createdAt: -1 }]],
        orderItems: [[{ orderId: 1, batchId: 1 }]],
        bids: [[{ batchId: 1, status: 1 }], [{ buyerId: 1, createdAt: -1 }]],
        payments: [[{ orderId: 1, status: 1 }]],
        disputes: [[{ orderId: 1 }, { unique: true }]],
        ratings: [[{ orderId: 1 }]],
        storageLedger: [[{ batchId: 1, checkOutDate: 1 }]],
        notifications: [[{ toUserId: 1, sentAt: -1 }]],
        auditLogs: [[{ entityId: 1, createdAt: -1 }]],
        qualityChecks: [[{ batchId: 1, stage: 1 }]],
        priceBenchmarks: [[{ cropType: 1, recordedAt: -1 }]]
    };

    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
        const collection = database.collection(collectionName);
        for (const [keys, options = {}] of collectionIndexes) {
            await collection.createIndex(keys, options);
        }
    }
}

async function seedDemoCollections(database) {
    const cropBatches = database.collection("cropBatches");
    if (await cropBatches.countDocuments() === 0) {
        await cropBatches.insertMany(demoBatches.map(({ id, crop, ...batch }) => ({ ...batch, legacyId: id, crop, createdAt: new Date() })));
    }

    const priceBenchmarks = database.collection("priceBenchmarks");
    if (await priceBenchmarks.countDocuments() === 0) {
        await priceBenchmarks.insertMany(forecast.map((item) => ({ cropType: item.crop, mandiPrice: item.mandi, platformAvg: item.platform, demand: item.demand, recordedAt: new Date() })));
    }
}

export async function closeDatabase() {
    await client?.close();
    client = undefined;
    database = undefined;
}
