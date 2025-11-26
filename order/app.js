// app.js
import client from "prom-client";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import orderRoutes from "./routes/orderRoute.js";
import cartRoutes from "./routes/cartRoute.js";

dotenv.config();

const app = express();

/* -------------------- 1. PROMETHEUS METRICS SETUP -------------------- */

client.collectDefaultMetrics(); // CPU, RAM, event loop, v.v.

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Thời gian xử lý HTTP request",
  labelNames: ["method", "route", "status_code"],
  buckets: [50, 100, 200, 500, 1000, 2000],
});

// Middleware đo thời gian từng request
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

/* -------------------- 2. MIDDLEWARE BÌNH THƯỜNG -------------------- */

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

global.gConfig = {
  auth_url: process.env.AUTH_SERVICE_URL,
  restaurant_url: process.env.RESTAURANT_SERVICE_URL,
  notification_url: process.env.NOTIFICATION_SERVICE_URL,
  admin_url: process.env.ADMIN_SERVICE_URL,
};

/* -------------------- 3. ROUTES CHÍNH -------------------- */

app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "order-service" });
});

// ✅ Metrics endpoint cho Prometheus (ĐẶT TRƯỚC 404)
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

/* -------------------- 4. ERROR & 404 HANDLERS -------------------- */

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default app;

///ahaghaigaggahhgouhaoahhrhfaho