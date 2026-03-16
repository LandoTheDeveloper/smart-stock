import vision from "@google-cloud/vision";

const client = new vision.ImageAnnotatorClient({
  keyFilename: "./google-credentials.json",
});

/**
 * Extract full OCR text from receipt image
 */
export async function extractText(filePath: string): Promise<string> {

  const [result] = await client.documentTextDetection(filePath);

  const text = result.fullTextAnnotation?.text;

  if (!text) {
    throw new Error("No OCR text detected from image");
  }

  return text;
}