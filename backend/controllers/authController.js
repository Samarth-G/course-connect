import { getUserProfileById, loginUser, registerUser } from "../services/authService.js";

const PASSWORD_MIN_LENGTH = 8;
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
    const registrationResult = await registerUser({
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      profileImage: req.file ? req.file.filename : "",
    });

    if (registrationResult.errorCode === "EMAIL_EXISTS") {
      return res.status(409).json({
        error: "Email is already registered",
      });
    }

    return res.status(201).json({
      message: "Registered successfully",
      token: registrationResult.token,
      user: registrationResult.user,
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
    const loginResult = await loginUser({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (loginResult.errorCode === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }

    return res.status(200).json({
      message: "Login successful",
      token: loginResult.token,
      user: loginResult.user,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to login",
    });
  }
}

export async function me(req, res) {
  try {
    const user = await getUserProfileById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ user });
  } catch {
    return res.status(500).json({ error: "Failed to fetch user" });
  }
}