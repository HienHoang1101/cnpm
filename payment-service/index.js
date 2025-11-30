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

// --- MONITORING: Prometheus client setup ---
import { collectDefaults, createHttpMetrics, register } from "../monitoring/metrics/metrics.js";

// initialize default process metrics
collectDefaults();

const { middleware: metricsMiddleware } = createHttpMetrics("payment-service");
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
// --- end monitoring ---

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
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB connection error:", err));
}

// Routes
app.use("/api/payment", paymentRoutes);

// Start Server (skip in test environment)
const PORT = process.env.PORT || 5004;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
  });
}

export default app;
