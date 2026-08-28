import bcrypt from "bcryptjs";
import { MongoClient } from "mongodb";
import { demoBatches, forecast } from "../data/demo-data.js";
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
            await seedDemoCollections(database);
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
    await seedDemoCollections(database);
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

    await ensureDemoUsers(database);
}

async function ensureDemoUsers(database) {
    const users = database.collection("users");
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const demoAccounts = [
        ["Asha Pawar", "farmer@directagri.dev", "farmer", "Pimpalgaon, Nashik"],
        ["FreshCart Procurement", "buyer@directagri.dev", "buyer", "Pune, Pune"],
        ["Ganesh Logistics", "transporter@directagri.dev", "transporter", "Nashik, Nashik"],
        ["Niphad Cold Storage", "storage@directagri.dev", "storage", "Niphad, Nashik"],
        ["Maharashtra Agriculture Desk", "government@directagri.dev", "government", "Mumbai, Mumbai"]
    ];
    for (const [name, email, role, location] of demoAccounts) {
        const existing = await users.findOne({ email });
        if (!existing) {
            await users.insertOne({ name, email, passwordHash, role, location, kycVerified: true, createdAt: new Date() });
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
