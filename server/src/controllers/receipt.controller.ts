import { Request, Response } from "express";
import fs from "fs/promises";

import { extractText } from "../services/ocrService";
import { parseReceipt } from "../services/receiptAIService";

export async function uploadReceiptController(req: Request, res: Response) {
  let filePath: string | undefined;

  try {
    console.log("Receipt upload controller hit");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    filePath = req.file.path;

    console.log("Uploaded receipt info:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    console.log("Starting OCR...");
    const text = await extractText(filePath);
    console.log("OCR complete");
    console.log("OCR preview:", text.slice(0, 1000));

    console.log("Starting receipt parse...");
    const groceries = await parseReceipt(text);
    console.log("Receipt parse complete:", groceries);

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
  } catch (err: unknown) {
    console.error("Receipt processing failed:", err);

    const message =
      err instanceof Error ? err.message : "Receipt processing failed";

    return res.status(500).json({
      success: false,
      message,
      error: message,
    });
  } finally {
    if (filePath) {
      try {
        await fs.unlink(filePath);
      } catch (unlinkErr) {
        console.error("Failed to delete uploaded receipt file:", unlinkErr);
      }
    }
  }
}