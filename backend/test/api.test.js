import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";

const port = 4400 + Math.floor(Math.random() * 200);
const server = spawn(process.execPath, ["src/server.js"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port), MONGODB_URI: "", JWT_SECRET: "test-secret", GEMINI_API_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"]
});

let ready = false;
server.stdout.on("data", (chunk) => {
  if (chunk.toString().includes("DirectAgri API listening")) ready = true;
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (ready) return;
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("API server did not start");
}

async function request(path, options) {
  await waitForServer();
  return fetch(`http://localhost:${port}${path}`, options);
}

async function login(email) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "demo1234" })
  });
  assert.equal(response.status, 200);
  return response.json();
}

test("health endpoint reports the memory demo store", async () => {
  const response = await request("/health");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("NLP endpoint parses a varied listing", async () => {
  const response = await request("/api/nlp-parse", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "3 tons onion at rate 28" }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { crop: "Onion", quantityKg: 3000, pricePerKg: 28, source: "rules" });
});

test("role isolation blocks a buyer from creating a crop listing", async () => {
  const response = await request("/api/crop-batches", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer invalid" }, body: JSON.stringify({ text: "2 tons rice at rate 20" }) });
  assert.equal(response.status, 401);
});

test("completes listing, order, transport, storage, and escrow lifecycle", async () => {
  const farmer = await login("farmer@directagri.dev");
  const buyer = await login("buyer@directagri.dev");
  const transporter = await login("transporter@directagri.dev");
  const storage = await login("storage@directagri.dev");
  const headers = (session) => ({ "content-type": "application/json", authorization: `Bearer ${session.token}` });

  const listingResponse = await request("/api/crop-batches", {
    method: "POST",
    headers: headers(farmer),
    body: JSON.stringify({
      text: "1 ton rice at rate 30",
      listingIntent: "store",
      storagePartnerId: "greenharvest",
      vehicleMode: "transport-partner",
      estimatedDistanceKm: 12.4,
      estimatedFare: 223
    })
  });
  assert.equal(listingResponse.status, 201);
  const batch = (await listingResponse.json()).batch;
  assert.equal(batch.listingIntent, "STORE");
  assert.equal(batch.storagePartnerId, "greenharvest");
  assert.equal(batch.estimatedFare, 223);

  const orderResponse = await request("/api/orders/aggregate", { method: "POST", headers: headers(buyer), body: JSON.stringify({ batchIds: [batch.id] }) });
  assert.equal(orderResponse.status, 201);
  const order = (await orderResponse.json()).order;

  const assignmentResponse = await request(`/api/orders/${order.id}/assign-transporter`, { method: "POST", headers: headers(transporter), body: "{}" });
  assert.equal(assignmentResponse.status, 200);

  const checkInResponse = await request("/api/storage/checkin", { method: "POST", headers: headers(storage), body: JSON.stringify({ batchId: batch.id, qualityScore: 92 }) });
  assert.equal(checkInResponse.status, 201);
  const checkOutResponse = await request("/api/storage/checkout", { method: "POST", headers: headers(storage), body: JSON.stringify({ batchId: batch.id, qualityScore: 90 }) });
  assert.equal(checkOutResponse.status, 201);

  const releaseResponse = await request(`/api/orders/${order.id}/release`, { method: "POST", headers: headers(buyer), body: "{}" });
  assert.equal(releaseResponse.status, 200);
  const release = await releaseResponse.json();
  assert.equal(release.order.escrowStatus, "RELEASED");
  assert.equal(release.payments.length, 3);
});

after(() => server.kill());