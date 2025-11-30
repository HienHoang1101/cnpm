import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/auth.js";
import { collectDefaults, register } from "../monitoring/metrics/metrics.js";

// Routes
import orderRoutes from "./routes/orderRoute.js";
import cartRoutes from "./routes/cartRoute.js";

const app = express();

// --- CẤU HÌNH MONITORING ---
collectDefaults(); // Thu thập CPU/RAM mặc định (idempotent)

// Expose endpoint /metrics cho Prometheus
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).send(ex);
  }
});
// ---------------------------

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);

// Error Handler
app.use(errorHandler);

export default app;