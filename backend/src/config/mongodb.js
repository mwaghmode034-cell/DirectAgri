import { MongoClient } from "mongodb";
import { MemoryDatabase } from "../lib/memory-db.js";

let client;
let database;
let usingMemory = false;

export async function getDatabase() {
    if (database) return database;

    const uri = process.env.MONGODB_URI;
    if (uri) {
        try {
            client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
            await client.connect();
            database = client.db(process.env.MONGODB_DB ?? "directagri");
            await ensureCollections(database);
            return database;
        } catch (error) {
            await client?.close().catch(() => { });
            client = undefined;
            console.warn(`MongoDB unavailable (${error.message}). Using in-memory demo store.`);
        }
    } else {
        console.warn("MONGODB_URI is not configured. Using in-memory demo store.");
    }

    usingMemory = true;
    database = new MemoryDatabase();
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

export function isMemoryStore() {
    return usingMemory;
}

export async function closeDatabase() {
    await client?.close();
    client = undefined;
    database = undefined;
    usingMemory = false;
}
