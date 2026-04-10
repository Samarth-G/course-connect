import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail, findUserById } from "../repositories/authRepository.js";
import { JWT_SECRET_KEY, JWT_EXPIRES_IN } from "../config/jwtConfig.js";

function buildTokenPayload(user) {
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage || "",
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
}

export async function registerUser({ name, email, password, profileImage = "" }) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return { errorCode: "EMAIL_EXISTS" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  let user;
  try {
    user = await createUser({ name, email, passwordHash, profileImage });
  } catch (err) {
    if (err.code === 11000) {
      return { errorCode: "EMAIL_EXISTS" };
    }
    throw err;
  }
  const safeUser = user.toJSON();

  return {
    user: safeUser,
    token: signToken(buildTokenPayload(safeUser)),
  };
}

export async function loginUser({ email, password }) {
  const user = await findUserByEmail(email);
  if (!user) {
    return { errorCode: "INVALID_CREDENTIALS" };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { errorCode: "INVALID_CREDENTIALS" };
  }

  const safeUser = user.toJSON();

  return {
    user: safeUser,
    token: signToken(buildTokenPayload(safeUser)),
  };
}

export async function getUserProfileById(id) {
  const user = await findUserById(id);
  return user ? user.toJSON() : null;
}
