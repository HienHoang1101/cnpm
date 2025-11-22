import request from "supertest";
import app from "../app.js";

describe("Order service - /health", () => {
  it("trả về status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "order-service");
  });
});
