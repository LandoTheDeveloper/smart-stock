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

  const prompt = `
        You are a grocery receipt parser.

        Extract ONLY grocery food items.

        Return STRICT JSON:

        [
        { "name": "string", "quantity": number }
        ]

        Output JSON ONLY.

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