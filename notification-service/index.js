import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { startRegistrationConsumer } from "./consumers/notificationConsumer.js";
import { collectDefaults, createHttpMetrics, register } from "../monitoring/metrics/metrics.js";

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

/* ==== Metrics (Prometheus) ==== */
// Use standardized metrics in seconds
collectDefaults();
const { middleware: metricsMiddleware } = createHttpMetrics("notification-service");
app.use(metricsMiddleware);

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

// Start server (skip in test environment)
const PORT = process.env.PORT || 5007;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}

export default app;

// Expose Prometheus metrics
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});
