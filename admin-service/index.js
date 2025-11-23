import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import RestaurantSettlement from "./routes/restaurantPaymentRoutes.js";
import { processWeeklySettlements } from "./controllers/settlementController.js";
import cron from "node-cron";
import client from "prom-client";

dotenv.config();

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply CORS globally
app.use(cors());

global.gConfig = {
  auth_url: process.env.AUTH_SERVICE_URL,
  restaurant_url: process.env.RESTAURANT_SERVICE_URL,
  notification_url: process.env.NOTIFICATION_SERVICE_URL,
  order_url: process.env.ORDER_SERVICE_URL,
};

// Run every Sunday at 11:30 PM
cron.schedule(
  "30 23 * * 0",
  async () => {
    try {
      console.log("Auto-processing weekly settlements...");
      await processWeeklySettlements();
    } catch (error) {
      console.error("Auto-settlement failed:", error);
    }
  },
  {
    timezone: "Asia/Colombo",
    name: "WeeklySettlements",
  }
);

// Routes
app.use("/api/settlements", RestaurantSettlement);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "admin-service" });
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

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
