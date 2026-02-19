const vision = require("@google-cloud/vision");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// OCR client
const client = new vision.ImageAnnotatorClient({
  keyFilename: "./google-credentials.json",
});

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {

  const [result] = await client.documentTextDetection("./ALDI_RECEIPT.jpg");
  console.log(result);
    const text = result.fullTextAnnotation?.text || "";

  console.log("OCR TEXT:\n", text);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();

  const groceries = JSON.parse(cleaned);

  console.log("\nPARSED GROCERIES:\n", groceries);

}

test();