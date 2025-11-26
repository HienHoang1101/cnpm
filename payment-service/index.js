import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import paymentRoutes from "./routes/paymentRoutes.js";
import client from "prom-client";

dotenv.config({ path: "../.env" }); // 👈 thêm dòng này
console.log("🔑 Stripe secret:", process.env.STRIPE_WEBHOOK_SECRET);

// Initialize Express
const app = express();

/* ==== Metrics ==== */
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Thời gian xử lý HTTP request",
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

// Apply CORS globally
app.use(cors());

// Important: Only apply json parsing to non-webhook routes
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/webhook") {
    next(); // Skip body parsing for webhook route
  } else {
    express.json()(req, res, next); // Apply JSON parsing to other routes
  }
});

global.gConfig = {
  auth_url: process.env.AUTH_SERVICE_URL,
  restaurant_url: process.env.RESTAURANT_SERVICE_URL,
  notification_url: process.env.NOTIFICATION_SERVICE_URL,
  order_url: process.env.ORDER_SERVICE_URL,
};

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "payment-service" });
});

// Metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Start Server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
