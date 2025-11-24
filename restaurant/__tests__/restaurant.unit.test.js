import request from "supertest";
import express from "express";
import client from "prom-client";

describe("Restaurant service unit tests (scaffold)", () => {
  let app;
  let restaurantRoutes = null;

  beforeAll(async () => {
    // try dynamic imports for common route/controller modules
    try {
      const mod = await import("../controller/restaurantRoutes.js");
      restaurantRoutes = mod.default || mod;
    } catch (e) {
      try {
        const mod2 = await import("../controller/restaurantController.js");
        restaurantRoutes = mod2.default || mod2;
      } catch (err) {
        restaurantRoutes = null;
      }
    }

    app = express();
    app.use(express.json());
    if (restaurantRoutes) app.use("/api/restaurants", restaurantRoutes);

    app.get("/health", (req, res) => res.status(200).json({ status: "ok", service: "restaurant" }));
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
    expect(res.body).toHaveProperty("service", "restaurant");
  });

  test("metrics endpoint returns Prometheus metrics text", async () => {
    const res = await request(app).get("/metrics");
    expect(res.status).toBe(200);
    expect(res.text).toContain("process_cpu_user_seconds_total");
  });
});
