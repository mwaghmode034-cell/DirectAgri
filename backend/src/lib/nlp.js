const CROPS = [
  ["pomegranate", "Pomegranate"],
  ["tomato", "Tomato"],
  ["onion", "Onion"],
  ["chilli", "Chilli"],
  ["chili", "Chilli"],
  ["wheat", "Wheat"],
  ["rice", "Rice"],
  ["maize", "Maize"],
  ["cotton", "Cotton"],
  ["soybean", "Soybean"],
  ["sugarcane", "Sugarcane"],
  ["potato", "Potato"],
  ["mango", "Mango"],
  ["banana", "Banana"],
  ["grapes", "Grapes"],
  ["grape", "Grapes"]
];

export function parseListingLocal(input) {
  const text = String(input ?? "").toLowerCase();
  let crop = "Mixed Produce";
  for (const [needle, label] of CROPS) {
    if (text.includes(needle)) {
      crop = label;
      break;
    }
  }

  return {
    crop,
    quantityKg: parseQuantityKg(text) ?? 500,
    pricePerKg: parsePricePerKg(text) ?? 25,
    source: "rules"
  };
}

function parseQuantityKg(text) {
  const tonne = text.match(/(\d+(?:\.\d+)?)\s*(?:tons?|tonnes?)\b/);
  if (tonne) return Math.round(Number(tonne[1]) * 1000);
  const quintal = text.match(/(\d+(?:\.\d+)?)\s*(?:quintals?|qtl)\b/);
  if (quintal) return Math.round(Number(quintal[1]) * 100);
  const kg = text.match(/(\d+(?:\.\d+)?)\s*(?:kgs?|kilograms?)\b/);
  if (kg) return Math.round(Number(kg[1]));
  return null;
}

function parsePricePerKg(text) {
  const priced = text.match(/(?:price|rate|at\s+rate|rs\.?|₹)\s*:?\s*(\d+(?:\.\d+)?)/);
  if (priced) return Number(priced[1]);
  const perKg = text.match(/(\d+(?:\.\d+)?)\s*(?:\/|per)\s*kg/);
  if (perKg) return Number(perKg[1]);
  return null;
}

function listingFromModel(parsed) {
  if (!parsed?.crop || !Number.isFinite(Number(parsed.quantityKg)) || !Number.isFinite(Number(parsed.pricePerKg))) {
    throw new Error("Gemini returned an incomplete listing");
  }
  return {
    crop: String(parsed.crop),
    quantityKg: Math.round(Number(parsed.quantityKg)),
    pricePerKg: Number(parsed.pricePerKg),
    source: "gemini"
  };
}

export async function parseListing(input) {
  const fallback = parseListingLocal(input);
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
        systemInstruction: { parts: [{ text: "Extract a crop listing. Return only JSON with crop (string), quantityKg (positive integer), and pricePerKg (positive number). Convert tons to 1000 kg and quintals to 100 kg. Do not invent missing values." }] },
        contents: [{ role: "user", parts: [{ text: input }] }]
      }),
      signal: AbortSignal.timeout(4500)
    });
    if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}: ${await response.text()}`);
    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "{}";
    return listingFromModel(JSON.parse(text));
  } catch {
    return fallback;
  }
}
