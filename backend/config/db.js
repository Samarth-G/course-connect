import mongoose from "mongoose";

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/course-connect";

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoUri}`);
}
