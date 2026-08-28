import test from "node:test";
import assert from "node:assert/strict";
import { parseListing } from "../src/lib/nlp.js";

test("parses tons and explicit price", async () => {
  assert.deepEqual(await parseListing("5 tons tomato price 19"), {
    crop: "Tomato",
    quantityKg: 5000,
    pricePerKg: 19
  });
});

test("parses quintals and rate wording", async () => {
  assert.deepEqual(await parseListing("2 quintals onion at rate 31"), {
    crop: "Onion",
    quantityKg: 200,
    pricePerKg: 31
  });
});

test("uses a safe default for incomplete messages", async () => {
  const parsed = await parseListing("fresh produce available tomorrow");
  assert.equal(parsed.crop, "Mixed Produce");
  assert.equal(parsed.quantityKg, 500);
  assert.equal(typeof parsed.pricePerKg, "number");
});
