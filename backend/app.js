import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import routers from "./routers/index.js";
import { sanitizeBody } from "./middleware/sanitize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
	origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
}));
app.use(express.json());

app.use(sanitizeBody);

app.use(rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Too many requests, please try again later" },
}));

app.use("/api/auth", rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: { error: "Too many auth requests, please try again later" },
}));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", routers);

app.use((err, _req, res, _next) => {
	console.error("Unhandled error:", err);
	const status = err.status || 500;
	res.status(status).json({
		error: err.message || "Internal server error",
	});
});

export default app;
