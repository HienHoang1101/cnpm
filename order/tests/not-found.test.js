import request from "supertest";
import app from "../app.js";

describe("Order service - 404 handler", () => {
  it("trả về 404 cho route không tồn tại", async () => {
    const res = await request(app).get("/some-random-route");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("success", false);
    expect(res.body.message).toMatch(/not found/i);
  });
});
