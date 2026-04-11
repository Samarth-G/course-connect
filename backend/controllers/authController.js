import { getUserProfileById, loginUser, registerUser, updateUserProfile } from "../services/authService.js";

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

    if (loginResult.errorCode === "ACCOUNT_DISABLED") {
      return res.status(403).json({
        error: "Your account has been disabled",
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

export async function updateProfile(req, res) {
  const { name, email } = req.body;
  const updateData = {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    if (!normalizedName || normalizedName.length > 100) {
      return res.status(400).json({ error: "name must be 1-100 characters" });
    }
    updateData.name = normalizedName;
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "email cannot be empty" });
    }
    updateData.email = normalizedEmail;
  }

  if (req.file) {
    updateData.profileImage = req.file.filename;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update" });
  }

  try {
    const updatedUser = await updateUserProfile(req.user.id, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email is already taken" });
    }
    return res.status(500).json({ error: "Failed to update profile" });
  }
}