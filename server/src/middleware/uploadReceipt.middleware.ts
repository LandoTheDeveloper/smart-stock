import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[^\w.\-]/g, "");

    const unique = `${Date.now()}-${safeOriginalName}`;
    cb(null, unique);
  },
});

export const uploadReceipt = multer({
  storage,

  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only image uploads are allowed"));
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});