import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware";
import { uploadReceipt } from "../middleware/uploadReceipt.middleware";
import { uploadReceiptController } from "../controllers/receipt.controller";

const router = Router();

router.post(
  "/upload",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    uploadReceipt.single("receipt")(req, res, (err: unknown) => {
      if (!err) {
        return next();
      }

      console.error("Multer receipt upload error:", err);

      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      const message =
        err instanceof Error ? err.message : "Receipt upload failed";

      return res.status(400).json({
        success: false,
        message,
      });
    });
  },
  uploadReceiptController
);

export default router;