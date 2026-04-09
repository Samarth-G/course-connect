import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import routers from "./routers/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
	origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", routers);

export default app;
