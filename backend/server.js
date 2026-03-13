import app from "./app.js";
import "dotenv/config";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

startServer();
