import express from "express";
import routers from "./routers/index.js";

const app = express();

app.use(express.json());
app.use("/api", routers);

export default app;
