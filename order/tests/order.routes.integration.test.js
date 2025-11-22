import { jest } from "@jest/globals";
import request from "supertest";

const mockOrderModel = {
  find: jest.fn(),
  countDocuments: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

jest.unstable_mockModule("../middleware/auth.js", () => ({
  __esModule: true,
  protect: (req, _res, next) => {
    req.user = { id: "user-123", role: "customer" };
    next();
  },
  authorize: (...roles) => (req, _res, next) => {
    req.user =
      req.user || { id: "user-123", role: roles[0] || "customer" };
    next();
  },
}));

jest.unstable_mockModule("../model/order.js", () => ({
  __esModule: true,
  default: mockOrderModel,
}));

const { default: app } = await import("../app.js");

describe("Order routes (integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /api/orders returns paginated orders for authenticated customer", async () => {
    const mockOrders = [
      {
        orderId: "ORD-1",
        createdAt: new Date("2024-01-01T00:00:00Z"),
        totalAmount: 42,
        type: "DELIVERY",
        restaurantOrder: {
          status: "PLACED",
          restaurantName: "Test Resto",
          restaurantImage: "image.jpg",
          items: [{ quantity: 2 }, { quantity: 1 }],
        },
      },
    ];

    const queryChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(mockOrders),
    };

    mockOrderModel.find.mockReturnValue(queryChain);
    mockOrderModel.countDocuments.mockResolvedValue(mockOrders.length);

    const res = await request(app)
      .get("/api/orders")
      .set("Authorization", "Bearer fake-token");

    expect(mockOrderModel.find).toHaveBeenCalledWith({
      customerId: "user-123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.orders[0]).toMatchObject({
      orderId: "ORD-1",
      status: "PLACED",
      restaurant: "Test Resto",
      restaurantImage: "image.jpg",
      totalItems: 3,
    });
    expect(res.body).toHaveProperty("total", 1);
    expect(res.body).toHaveProperty("page", 1);
    expect(res.body).toHaveProperty("limit");
  });
});
