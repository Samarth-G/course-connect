import jwt from "jsonwebtoken";
import { JWT_SECRET_KEY } from "../config/jwtConfig.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();

  try {
    const payload = jwt.verify(token, JWT_SECRET_KEY);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      profileImage: payload.profileImage || "",
    };
    return next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}