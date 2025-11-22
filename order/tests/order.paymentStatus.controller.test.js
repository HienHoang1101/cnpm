import { jest } from "@jest/globals";
import request from "supertest";

const mockOrderModel = {
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../model/order.js", () => ({
  __esModule: true,
  default: mockOrderModel,
}));

const { default: app } = await import("../app.js");

describe("PATCH /api/orders/:orderId/payment/status", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when status or transaction is missing", async () => {
    const res = await request(app)
      .patch("/api/orders/ORD-TEST/payment/status")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
    expect(mockOrderModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test("returns 200 and updated order when payload is valid", async () => {
    mockOrderModel.findOneAndUpdate.mockResolvedValue({
      orderId: "ORD-TEST",
      restaurantOrder: { status: "PLACED" },
      paymentStatus: "PAID",
      paymentDetails: { transactionId: "txn-123" },
    });

    const res = await request(app)
      .patch("/api/orders/ORD-TEST/payment/status")
      .send({
        status: "PAID",
        paymentDetails: { transactionId: "txn-123" },
      });

    expect(res.statusCode).toBe(200);
    expect(mockOrderModel.findOneAndUpdate).toHaveBeenCalled();
    expect(res.body).toMatchObject({
      success: true,
      order: {
        orderId: "ORD-TEST",
        paymentStatus: "PAID",
      },
    });
  });
});
