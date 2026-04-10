import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uploadsDir = fileURLToPath(new URL("../uploads", import.meta.url));

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const resourceUpload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});
