import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export interface ParsedGrocery {
  name: string;
  quantity: number;
  expected_expiration: string;
}

/**
 * Send OCR text to Gemini and parse groceries
 */
export async function parseReceipt(text: string): Promise<ParsedGrocery[]> {

  const today = new Date().toISOString().split("T")[0];

    const prompt = `
        You are a grocery receipt parser.

        IMPORTANT RULES:

        Return ONLY valid JSON.
        No markdown.
        No explanations.

        Some grocery receipts DO NOT show weight or size.

        When weight/size is missing:

        Estimate a REALISTIC grocery quantity using common US package sizes.

        Examples:

        Ground Beef: typically 1 lb, 2 lb, 3 lb, or 4 lb → estimate best guess
        Milk: usually 1 gallon or 0.5 gallon
        Eggs: usually 6 or 12 or 18 count
        Chicken breast: usually 1-3 lbs
        Rice: often 1 lb, 2 lb, or 5 lb bag

        If an item is produce (bananas, apples, etc):

        Estimate reasonable pounds or count.

        Use today's date: ${today}

        Estimate expiration using typical shelf life.

        Return EXACTLY:

        [
        {
            "name": "Full grocery item name",
            "quantity": number,
            "unit": "lbs | oz | count | gallon | package",
            "expected_expiration": "YYYY-MM-DD"
        }
        ]

        Receipt text:

        ${text}
    `;

  const response = await model.generateContent(prompt);

  const raw = response.response.text();

  // Extract JSON safely
  const match = raw.match(/\[[\s\S]*\]/);

  if (!match) {
    throw new Error("AI returned invalid JSON");
  }

  return JSON.parse(match[0]) as ParsedGrocery[];
}