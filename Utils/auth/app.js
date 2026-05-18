// app.js
import express, { json } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import connectDB from "./config/dbConfig.js";

config();
connectDB();

import authRoutes from "./routes/authRoutes.js";

const app = express();
app.use(cors());
app.use(json());
app.use(cookieParser());

// Base route
app.get("/Healthz", (req, res) => res.send("AI HR Backend Running ✅"));

// Auth Routes
app.use("/api/auth", authRoutes);

export default app;