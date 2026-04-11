import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import "dotenv/config";
import { connectDB } from "./config/db.js";
import { seedDatabase } from "./services/seedDatabase.js";
import { setIO } from "./socket.js";

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

    const httpServer = createServer(app);
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST"],
      },
    });

    setIO(io);

    io.on("connection", (socket) => {
      console.log(`Socket connected: ${socket.id}`);
      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    httpServer.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

startServer();
