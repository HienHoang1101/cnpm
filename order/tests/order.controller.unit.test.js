import { jest } from "@jest/globals";
import { mockRequest, mockResponse } from "./testUtils.js";

const mockOrderModel = {
  find: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../model/order.js", () => ({
  __esModule: true,
  default: mockOrderModel,
}));

const {
  getOrdersByIds,
  updateOrderPaymentStatus,
  queryOrders,
} = await import("../controller/orderController.js");

describe("orderController (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getOrdersByIds returns 400 when orderIds is missing", async () => {
    const req = mockRequest({ body: {} });
    const res = mockResponse();

    await getOrdersByIds(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Valid orderIds array is required",
      })
    );
    expect(mockOrderModel.find).not.toHaveBeenCalled();
  });

  test("getOrdersByIds returns missingIds when some orders are not found", async () => {
    const req = mockRequest({
      body: { orderIds: ["ORD-1", "ORD-2", "ORD-3"] },
    });
    const res = mockResponse();

    mockOrderModel.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { orderId: "ORD-1" },
        { orderId: "ORD-3" },
      ]),
    });

    await getOrdersByIds(req, res);

    expect(mockOrderModel.find).toHaveBeenCalledWith({
      orderId: { $in: ["ORD-1", "ORD-2", "ORD-3"] },
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        count: 2,
        missingIds: ["ORD-2"],
      })
    );
  });

  test("updateOrderPaymentStatus returns 200 and updated order when status is valid", async () => {
    const req = mockRequest({
      params: { orderId: "ORD-PAID" },
      body: {
        status: "PAID",
        paymentDetails: { transactionId: "txn-1" },
      },
    });
    const res = mockResponse();

    mockOrderModel.findOneAndUpdate.mockResolvedValue({
      orderId: "ORD-PAID",
      restaurantOrder: { status: "PLACED" },
      paymentStatus: "PAID",
      paymentDetails: { transactionId: "txn-1" },
    });

    await updateOrderPaymentStatus(req, res);

    expect(mockOrderModel.findOneAndUpdate).toHaveBeenCalledWith(
      { orderId: "ORD-PAID" },
      expect.objectContaining({
        $set: expect.objectContaining({
          paymentStatus: "PAID",
          "restaurantOrder.status": "PLACED",
        }),
        $push: expect.any(Object),
      }),
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        order: expect.objectContaining({
          orderId: "ORD-PAID",
          paymentStatus: "PAID",
        }),
      })
    );
  });

  test("queryOrders returns 400 when startDate or endDate is missing", async () => {
    const req = mockRequest({
      query: { startDate: "", endDate: "" },
    });
    const res = mockResponse();

    await queryOrders(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "startDate and endDate are required parameters",
      })
    );
  });
});
