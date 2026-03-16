import { Request, Response } from "express";
import fs from "fs/promises";

import { extractText } from "../services/ocrService";
import { parseReceipt } from "../services/receiptAIService";
import PantryItem from "../models/PantryItem";
import {
  getHouseholdContext,
  buildItemAttribution,
} from "../utils/household.utils";

export async function uploadReceiptController(req: Request, res: Response) {
  let filePath: string | undefined;

  try {
    const userId =
      (req as any).userId ||
      (req.user as any)?._id ||
      (req.user as any)?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const context = await getHouseholdContext(userId);
    if (!context) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

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

    const savedItems = [];

    for (const grocery of groceries) {
      if (!grocery?.name) continue;

      const newItem = new PantryItem({
        ...buildItemAttribution(context),
        name: grocery.name,
        quantity: grocery.quantity || 1,
        unit: grocery.unit,
        expirationDate: grocery.expected_expiration
          ? new Date(grocery.expected_expiration)
          : undefined,
        storageLocation: "Pantry",
      });

      await newItem.save();
      savedItems.push(newItem);
    }

    return res.status(201).json({
      success: true,
      message: "Receipt processed and pantry items added successfully",
      groceries,
      importedCount: savedItems.length,
      data: savedItems,
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