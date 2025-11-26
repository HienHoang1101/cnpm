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
