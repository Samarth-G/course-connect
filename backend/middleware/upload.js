import multer from "multer";
import path from "path";
import { PROFILE_IMAGE_MAX_BYTES } from "../config/uploadLimits.js";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif"];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, "uploads/");
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (png, jpg, jpeg, gif) are allowed"), false);
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: PROFILE_IMAGE_MAX_BYTES }, // 5 MB
});
