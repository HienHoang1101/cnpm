import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import client from "prom-client";

dotenv.config();
const app = express();

/* -------------------- PROMETHEUS METRICS SETUP -------------------- */
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "HTTP request duration in ms",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 500, 1000, 2000],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(Date.now() - start);
  });
  next();
});

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import seedAdminUser from "./utils/seedAdmin.js";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

// Expose Prometheus metrics
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const PORT = process.env.PORT || 5001;
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    if (process.env.AUTO_SEED_ADMIN === "true") {
      try {
        await seedAdminUser();
        console.log("Admin user check completed");
      } catch (error) {
        console.error("Error checking admin user:", error.message);
      }
    }
    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
