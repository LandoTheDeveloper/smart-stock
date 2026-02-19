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

IMPORTANT:

Return ONLY valid JSON.
Do NOT repeat items.
Do NOT output duplicate fields.
Do NOT output partial objects.
Do NOT output explanation text.
Do NOT output markdown.

If unsure, skip the item.

Use today's date: ${today}

Estimate expiration using typical grocery shelf life.

Return EXACTLY this format:

[
  {
    "name": "Full grocery item name",
    "quantity": number,
    "expected_expiration": "YYYY-MM-DD"
  }
]

JSON ONLY.
NO EXTRA TEXT.

Receipt:

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