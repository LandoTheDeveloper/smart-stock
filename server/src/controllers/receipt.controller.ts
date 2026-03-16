import { Request, Response } from "express";
import fs from "fs/promises";

import { extractText } from "../services/ocrService";
import { parseReceipt } from "../services/receiptAIService";

export async function uploadReceiptController(req: Request, res: Response) {
  let filePath: string | undefined;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    filePath = req.file.path;

    const text = await extractText(filePath);
    const groceries = await parseReceipt(text);

    if (!Array.isArray(groceries) || groceries.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No groceries were parsed from the receipt",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Receipt parsed successfully",
      groceries,
    });
  } catch (err: any) {
    console.error("Receipt upload failed:", err);

    return res.status(500).json({
      success: false,
      message: "Receipt processing failed",
      error: err.message,
    });
  } finally {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch {}
    }
  }
}