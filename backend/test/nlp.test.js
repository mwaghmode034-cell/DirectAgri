import test from "node:test";
import assert from "node:assert/strict";
import { parseListing } from "../src/lib/nlp.js";

process.env.GEMINI_API_KEY = "";

test("parses tons and explicit price", async () => {
  assert.deepEqual(await parseListing("5 tons tomato price 19"), {
    crop: "Tomato",
    quantityKg: 5000,
    pricePerKg: 19,
    source: "rules"
  });
});

test("parses quintals and rate wording", async () => {
  assert.deepEqual(await parseListing("2 quintals onion at rate 31"), {
    crop: "Onion",
    quantityKg: 200,
    pricePerKg: 31,
    source: "rules"
  });
});

test("uses a safe default for incomplete messages", async () => {
  const parsed = await parseListing("fresh produce available tomorrow");
  assert.equal(parsed.crop, "Mixed Produce");
  assert.equal(parsed.quantityKg, 500);
  assert.equal(typeof parsed.pricePerKg, "number");
});
