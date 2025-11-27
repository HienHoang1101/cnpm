import express from "express";
import cors from "cors";
import BodyParser from "body-parser";
import mongoose from "mongoose";
import { MONGOURL, PORT } from "./config.js";
import dotenv from "dotenv";
import Owner from "./routes/ResturantOwnerRoute.js";
import Admin from "./routes/branchAdminRoute.js";

const app = express();
dotenv.config();

// --- MONITORING: use shared metrics helper ---
import { collectDefaults, createHttpMetrics, register } from "../monitoring/metrics/metrics.js";

collectDefaults();
const { middleware: metricsMiddleware } = createHttpMetrics("restaurant-service");
app.use(metricsMiddleware);

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
// --- end monitoring ---

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

global.gConfig = {
  orders_url: process.env.ORDERS_SERVICE_URL || "http://localhost:5002", // Adjust port as needed
  notification_url: process.env.NOTIFICATION_SERVICE_URL,
};

app.use(express.json());
app.use(BodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api", Owner);
app.use("/api/branch", Admin);

const startServer = async () => {
  try {
    await mongoose.connect(MONGOURL);
    console.log("✅ Database Connected Successfully");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is Running on Port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Error connecting to the database:", error);
  }
};
startServer();
