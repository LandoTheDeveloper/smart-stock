import multer from "multer";
import path from "path";
import fs from "fs";

// ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, unique);
  },
});

export const uploadReceipt = multer({
  storage,

  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },

  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});