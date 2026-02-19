import { Router } from "express";
import { uploadReceipt } from "../middleware/uploadReceipt.middleware";
import { uploadReceiptController } from "../controllers/receipt.controller";

const router = Router();

router.post(
  "/upload",
  uploadReceipt.single("receipt"),
  uploadReceiptController
);

export default router;