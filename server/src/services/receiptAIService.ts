import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedGrocery {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  storageLocation: string;
  expected_expiration: string;
}

const VALID_UNITS = ["count", "g", "kg", "ml", "L", "oz", "lb", "cups", "tbsp", "tsp", "pcs", "pack", "box", "can", "bottle", "bag"];
const VALID_CATEGORIES = ["Dairy", "Produce", "Meat", "Seafood", "Bakery", "Frozen", "Canned Goods", "Grains & Pasta", "Snacks", "Beverages", "Condiments", "Spices", "Other"];
const VALID_LOCATIONS = ["Fridge", "Freezer", "Pantry", "Counter"];

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

function normalizeUnit(unit: unknown): string {
  const value = String(unit || "").toLowerCase().trim();

  const mapping: Record<string, string> = {
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
    oz: "oz", ounce: "oz", ounces: "oz",
    g: "g", gram: "g", grams: "g",
    kg: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", milliliter: "ml", milliliters: "ml",
    l: "L", liter: "L", liters: "L", litre: "L", litres: "L",
    cup: "cups", cups: "cups",
    tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
    tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
    count: "count", each: "count", ct: "count", ea: "count",
    pc: "pcs", pcs: "pcs", piece: "pcs", pieces: "pcs",
    pack: "pack", package: "pack", pkg: "pack",
    box: "box", bag: "bag", can: "can", bottle: "bottle",
    gallon: "L", gal: "L", "half-gallon": "L",
    jar: "bottle",
  };

  return mapping[value] || "count";
}

function normalizeCategory(cat: unknown): string {
  const value = String(cat || "").trim();
  if (VALID_CATEGORIES.includes(value)) return value;

  const lower = value.toLowerCase();
  for (const valid of VALID_CATEGORIES) {
    if (lower === valid.toLowerCase()) return valid;
  }
  return "Other";
}

function normalizeLocation(loc: unknown): string {
  const value = String(loc || "").trim();
  if (VALID_LOCATIONS.includes(value)) return value;

  const lower = value.toLowerCase();
  for (const valid of VALID_LOCATIONS) {
    if (lower === valid.toLowerCase()) return valid;
  }
  return "Pantry";
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
        category: normalizeCategory(obj.category),
        storageLocation: normalizeLocation(obj.storageLocation),
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

Allowed units: ${JSON.stringify(VALID_UNITS)}
Allowed categories: ${JSON.stringify(VALID_CATEGORIES)}
Allowed storageLocations: ${JSON.stringify(VALID_LOCATIONS)}

Use today's date: ${today}
Estimate expiration using typical shelf life for each product.
Pick the most appropriate category and storageLocation for each item.
If quantity or unit is unclear, make a realistic best guess.

Return this shape:
[
  {
    "name": "Full grocery item name",
    "quantity": 1,
    "unit": "count",
    "category": "Produce",
    "storageLocation": "Fridge",
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
