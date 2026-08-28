import { forecast } from "../data/demo-data.js";

export async function parseListing(input) {
  const fallback = parseListingWithRules(input);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallback;

  try {
    const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const endpoint = process.env.GEMINI_API_URL ?? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
        systemInstruction: { parts: [{ text: "Extract a crop listing. Return only JSON with crop (string), quantityKg (positive integer), and pricePerKg (positive number). Convert tons to 1000 kg and quintals to 100 kg. Use the rule-based values if a field is missing." }] },
        contents: [{ role: "user", parts: [{ text: `Rule-based fallback: ${JSON.stringify(fallback)}\nListing: ${input}` }] }]
      }),
      signal: AbortSignal.timeout(4500)
    });
    if (!response.ok) return fallback;
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "{}";
    const parsed = JSON.parse(text);
    if (!parsed.crop || !Number.isFinite(Number(parsed.quantityKg)) || !Number.isFinite(Number(parsed.pricePerKg))) return fallback;
    return { crop: String(parsed.crop), quantityKg: Math.round(Number(parsed.quantityKg)), pricePerKg: Number(parsed.pricePerKg) };
  } catch {
    return fallback;
  }
}

function parseListingWithRules(input) {
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
