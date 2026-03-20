import express from "express";
import cors from "cors";
import routers from "./routers/index.js";

const app = express();

app.use(cors({
	origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
}));
app.use(express.json());
app.use("/api", routers);

export default app;
