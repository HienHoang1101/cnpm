import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startRegistrationConsumer } from "./consumers/notificationConsumer.js";
import client from "prom-client";

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

/* ==== Metrics (Prometheus) ==== */
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

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

global.gConfig = {
  auth_url: process.env.AUTH_SERVICE_URL,
  restaurant_url: process.env.RESTAURANT_SERVICE_URL,
  notification_url: process.env.NOTIFICATION_SERVICE_URL,
  order_url: process.env.ORDER_SERVICE_URL,
};

// Routes
app.use("/api/notifications", notificationRoutes);

// Start Kafka consumer (optional)
if (process.env.ENABLE_KAFKA === "true") {
  startRegistrationConsumer();
} else {
  console.log("Kafka consumer disabled (ENABLE_KAFKA!=true)");
}

// Start server
const PORT = process.env.PORT || 5007;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
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
