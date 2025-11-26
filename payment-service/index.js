import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config({ path: "../.env" }); // 👈 thêm dòng này
console.log("🔑 Stripe secret:", process.env.STRIPE_WEBHOOK_SECRET);

// Initialize Express
const app = express();

// --- MONITORING: Prometheus client setup ---
import client from "prom-client";
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "code"],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5],
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/payment", paymentRoutes);

// Start Server
const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
  console.log(`Payment service running on port ${PORT}`);
});
