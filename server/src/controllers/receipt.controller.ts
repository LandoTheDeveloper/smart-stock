import { Request, Response } from "express";
import fs from "fs/promises";

import { extractText } from "../services/ocrService";
import { parseReceipt } from "../services/receiptAIService";

export async function uploadReceiptController(req: Request, res: Response) {

  let filePath: string | undefined;

  try {

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    filePath = req.file.path;

    const text = await extractText(filePath);

    const groceries = await parseReceipt(text);

    return res.json({
      success: true,
      groceries,
    });

  } catch (err) {

    console.error("Receipt upload failed:", err);

    return res.status(500).json({
      error: "Receipt processing failed",
    });

  } finally {

    // Delete temp file
    if (filePath) {
      try { await fs.unlink(filePath); } catch {}
    }

  }
}