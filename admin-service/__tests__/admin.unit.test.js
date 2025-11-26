import request from "supertest";
import express from "express";
import client from "prom-client";
import settlementRoutes from "../routes/restaurantPaymentRoutes.js";

describe("Admin service unit tests (scaffold)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/settlements", settlementRoutes);

    app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "admin-service" }));
    app.get("/metrics", async (req, res) => {
      res.set("Content-Type", client.register.contentType);
      res.end(await client.register.metrics());
    });
    client.collectDefaultMetrics();
  });

  test("health endpoint returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("service", "admin-service");
  });

  test("metrics endpoint returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });
  afterAll(() => {
    try { client.register.clear(); } catch (e) { /* ignore */ }
  });
});
