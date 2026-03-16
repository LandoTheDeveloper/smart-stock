import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { uploadReceipt } from "../middleware/uploadReceipt.middleware";
import { uploadReceiptController } from "../controllers/receipt.controller";

const router = Router();

router.post(
  "/upload",
  authenticate,
  uploadReceipt.single("receipt"),
  uploadReceiptController
);

export default router;