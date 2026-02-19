const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function parseReceipt(text) {

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const raw = response.text();

  return JSON.parse(raw);
}