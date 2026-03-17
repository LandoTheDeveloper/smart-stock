import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedGrocery {
  name: string;
  quantity: number;
  unit: "lbs" | "oz" | "count" | "gallon" | "package";
  expected_expiration: string;
}

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });
}

function normalizeUnit(unit: unknown): ParsedGrocery["unit"] {
  const value = String(unit || "").toLowerCase().trim();

  if (["lb", "lbs", "pound", "pounds"].includes(value)) return "lbs";
  if (["oz", "ounce", "ounces"].includes(value)) return "oz";
  if (["count", "each", "ct", "pc", "pcs", "piece", "pieces"].includes(value)) return "count";
  if (["gallon", "gal", "half-gallon", "1/2 gallon"].includes(value)) return "gallon";
  if (["package", "pack", "pkg", "bag", "box", "bottle", "jar"].includes(value)) return "package";

  return "count";
}

function normalizeDate(value: unknown): string {
  const s = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 7);
  return fallback.toISOString().split("T")[0];
}

function normalizeParsedGroceries(value: unknown): ParsedGrocery[] {
  if (!Array.isArray(value)) {
    throw new Error("AI returned JSON, but it was not an array");
  }

  const normalized = value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const obj = item as Record<string, unknown>;

      const name = String(obj.name || "").trim();
      const quantityRaw = obj.quantity;
      const quantity =
        typeof quantityRaw === "number"
          ? quantityRaw
          : Number.parseFloat(String(quantityRaw || "1"));

      if (!name) return null;

      return {
        name,
        quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        unit: normalizeUnit(obj.unit),
        expected_expiration: normalizeDate(obj.expected_expiration),
      } satisfies ParsedGrocery;
    })
    .filter((item): item is ParsedGrocery => item !== null);

  return normalized;
}

export async function parseReceipt(text: string): Promise<ParsedGrocery[]> {
  if (!text || !text.trim()) {
    throw new Error("No OCR text was provided to receipt parser");
  }

  const model = getModel();
  const today = new Date().toISOString().split("T")[0];

  const prompt = `
You are a grocery receipt parser.

Return ONLY a JSON array.
No markdown.
No explanation.
No text before or after the JSON.

Extract only grocery food items from this receipt text.
Exclude taxes, subtotal, total, discounts, coupons, payment lines, loyalty lines, fees, and alcohol.

Allowed units:
"lbs", "oz", "count", "gallon", "package"

Use today's date: ${today}
Estimate expiration using typical shelf life.
If quantity or unit is unclear, make a realistic best guess.

Return this shape:
[
  {
    "name": "Full grocery item name",
    "quantity": 1,
    "unit": "count",
    "expected_expiration": "YYYY-MM-DD"
  }
]

Receipt text:
${text}
`;

  try {
    const response = await model.generateContent(prompt);
    const raw = response?.response?.text()?.trim();

    if (!raw) {
      throw new Error("AI returned an empty response");
    }

    const match = raw.match(/\[[\s\S]*\]/);

    if (!match) {
      throw new Error(`AI returned invalid JSON: ${raw.slice(0, 500)}`);
    }

    const parsed: unknown = JSON.parse(match[0]);
    const groceries = normalizeParsedGroceries(parsed);

    if (!groceries.length) {
      throw new Error("No grocery items could be parsed from AI response");
    }

    return groceries;
  } catch (err) {
    console.error("Receipt AI parsing failed:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to parse receipt text"
    );
  }
}