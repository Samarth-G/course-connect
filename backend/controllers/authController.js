import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const PASSWORD_MIN_LENGTH = 8;
const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage || "",
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export async function register(req, res) {
  const { name, email, password } = req.body;

  const normalizedName = String(name ?? "").trim();
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      error: "name, email, and password are required",
    });
  }

  if (normalizedPassword.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({
      error: `password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    });
  }

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(normalizedPassword, 10);

    const profileImage = req.file ? req.file.filename : "";

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      profileImage,
    });

    const safeUser = user.toJSON();
    const token = signToken(buildTokenPayload(safeUser));

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to register",
    });
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (!normalizedEmail || !normalizedPassword) {
    return res.status(400).json({
      error: "email and password are required",
    });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(normalizedPassword, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    const safeUser = user.toJSON();
    const token = signToken(buildTokenPayload(safeUser));

    return res.status(200).json({
      message: "Login successful",
      token,
      user: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to login",
    });
  }
}

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user: user.toJSON() });
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
}