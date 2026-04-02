import app from "./app.js";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { seedDatabase } from "./services/seedDatabase.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const shouldSeed =
      process.env.SEED_DATABASE === "true" ||
      process.env.NODE_ENV !== "production";

    if (shouldSeed) {
      await seedDatabase();
    }
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

startServer();
