import request from "supertest";
import express from "express";
import client from "prom-client";

// Stripe client initializes on module import; ensure env var is present before importing routes
let paymentRoutes;

describe("Payment service unit tests (scaffold)", () => {
  let app;

  beforeAll(async () => {
    // ensure stripe env var for tests
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

    // now import routes
    const mod = await import("../routes/paymentRoutes.js");
    paymentRoutes = mod.default || mod;

    app = express();
    app.use(express.json());
    app.use("/api/payment", paymentRoutes);

    app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "payment-service" }));
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
    expect(res.body).toHaveProperty("service", "payment-service");
  });

  test("metrics endpoint returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });
});
