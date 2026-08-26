import { forecast } from "../data/demo-data.js";

export function parseListing(input) {
  const lower = input.toLowerCase();
  const crop =
    ["onion", "tomato", "grapes", "pomegranate", "wheat", "rice"].find((item) => lower.includes(item)) ??
    "Mixed Produce";
  const quantityMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ton|tons|tonne|tonnes|kg|kgs|quintal|quintals)/);
  const priceMatch = lower.match(/(?:rs|₹|inr|price|rate)\s*\.?\s*(\d+(?:\.\d+)?)/);
  const quantityKg = quantityMatch
    ? Math.round(
        Number(quantityMatch[1]) *
          (quantityMatch[2].startsWith("ton") ? 1000 : quantityMatch[2].startsWith("quintal") ? 100 : 1)
      )
    : 500;
  const pricePerKg = priceMatch
    ? Number(priceMatch[1])
    : forecast.find((item) => item.crop.toLowerCase() === crop)?.platform ?? 25;

  return {
    crop: crop.replace(/\b\w/g, (char) => char.toUpperCase()),
    quantityKg,
    pricePerKg
  };
}
