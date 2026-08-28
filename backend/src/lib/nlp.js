export async function parseListing(input) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is required for listing extraction");

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
    const parsed = JSON.parse(text);
    if (!parsed.crop || !Number.isFinite(Number(parsed.quantityKg)) || !Number.isFinite(Number(parsed.pricePerKg))) {
      throw new Error("Gemini returned an incomplete listing");
    }
    return { crop: String(parsed.crop), quantityKg: Math.round(Number(parsed.quantityKg)), pricePerKg: Number(parsed.pricePerKg) };
  } catch (error) {
    throw new Error(`Gemini listing extraction failed: ${error.message}`);
  }
}
