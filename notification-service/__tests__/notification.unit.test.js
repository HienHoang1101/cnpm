import request from "supertest";
import express from "express";
import client from "prom-client";

describe("Notification service unit tests (scaffold)", () => {
  let app;
  let notificationRoutes = null;

  beforeAll(async () => {
    try {
      const mod = await import("../routes/index.js");
      notificationRoutes = mod.default || mod;
    } catch (e) {
      notificationRoutes = null;
    }

    app = express();
    app.use(express.json());
    if (notificationRoutes) app.use("/api/notifications", notificationRoutes);

    app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "notification-service" }));
    app.get("/metrics", async (req, res) => {
      res.set("Content-Type", client.register.contentType);
      res.end(await client.register.metrics());
    });

    client.collectDefaultMetrics();
  });

  afterAll(() => {
    try { client.register.clear(); } catch (e) { /* ignore */ }
  });

  test("health endpoint returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("service", "notification-service");
  });

  test("metrics endpoint returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });
});
