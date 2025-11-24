import request from "supertest";
import express from "express";
import client from "prom-client";
import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";

describe("Auth service unit tests (scaffold)", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/users", userRoutes);

    // lightweight health + metrics for tests
    app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "auth-service" }));
    app.get("/metrics", async (req, res) => {
      res.set("Content-Type", client.register.contentType);
      res.end(await client.register.metrics());
    });
    // ensure default metrics are collected in test environment
    client.collectDefaultMetrics();
  });

  afterAll(() => {
    // clear registry to avoid duplicate metric registration across tests
    try { client.register.clear(); } catch (e) { /* ignore */ }
  });

  test("health endpoint returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("service", "auth-service");
  });

  test("metrics endpoint returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });
});
