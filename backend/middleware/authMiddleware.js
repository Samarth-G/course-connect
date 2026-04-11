import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/jwtConfig.js";
import User from "../models/userModel.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY);

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (!user.enabled) {
      return res.status(403).json({ error: "Account is disabled" });
    }

    req.user = {
      id: payload.sub,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage || "",
      role: user.role || "user",
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}