import express from "express";
import { login, me, register } from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;