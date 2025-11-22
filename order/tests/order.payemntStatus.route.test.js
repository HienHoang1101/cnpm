import { updateOrderPaymentStatus } from "../controller/orderController.js";
import { mockRequest, mockResponse } from "./testUtils.js";

describe("updateOrderPaymentStatus controller - validation", () => {
  it("trả 400 nếu thiếu status", async () => {
    const req = mockRequest({
      params: { orderId: "ORD-123" },
      body: {
        paymentDetails: {
          transactionId: "tx_123",
          paymentProcessor: "STRIPE",
        },
      },
    });
    const res = mockResponse();

    await updateOrderPaymentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Status and transaction details are required"),
      })
    );
  });

  it("trả 400 nếu thiếu transactionId trong paymentDetails", async () => {
    const req = mockRequest({
      params: { orderId: "ORD-123" },
      body: {
        status: "PAID",
        paymentDetails: {
          paymentProcessor: "STRIPE",
          // thiếu transactionId
        },
      },
    });
    const res = mockResponse();

    await updateOrderPaymentStatus(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Status and transaction details are required"),
      })
    );
  });
});
