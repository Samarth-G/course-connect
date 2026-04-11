const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable must be set in production");
}

export const JWT_SECRET_KEY = JWT_SECRET || "fallback-secret-for-development";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
