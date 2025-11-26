import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import RestaurantSettlement from "./routes/restaurantPaymentRoutes.js";
import { processWeeklySettlements } from "./controllers/settlementController.js";
import cron from "node-cron";

dotenv.config();

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

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
