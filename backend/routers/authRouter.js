import express from "express";
import { login, me, register, updateProfile } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, upload.single("profileImage"), updateProfile);

export default router;