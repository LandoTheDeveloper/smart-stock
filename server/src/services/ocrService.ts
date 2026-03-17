import vision from "@google-cloud/vision";

function createVisionClient() {
  const rawJson = process.env.GOOGLE_CREDENTIALS_JSON?.trim();

  if (rawJson) {
    return new vision.ImageAnnotatorClient({
      credentials: JSON.parse(rawJson),
    });
  }

  return new vision.ImageAnnotatorClient();
}

const client = createVisionClient();

export async function extractText(filePath: string): Promise<string> {
  try {
    const [result] = await client.textDetection(filePath);
    const text = result.textAnnotations?.[0]?.description?.trim();

    if (!text) {
      throw new Error("No text detected in image");
    }

    return text;
  } catch (err) {
    console.error("Google Vision OCR failed:", err);

    throw new Error(
      err instanceof Error ? err.message : "Failed to extract text from receipt"
    );
  }
}