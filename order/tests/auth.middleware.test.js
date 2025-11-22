import { jest } from "@jest/globals";
import { authorize } from "../middleware/auth.js";
import { mockRequest, mockResponse } from "./testUtils.js";

describe("authorize middleware", () => {
  it("trả 401 nếu chưa đăng nhập (không có req.user)", () => {
    const req = mockRequest(); // không user
    const res = mockResponse();
    const next = jest.fn();

    const middleware = authorize("customer");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Not authenticated" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("trả 403 nếu role không được phép", () => {
    const req = mockRequest({ user: { role: "customer" } });
    const res = mockResponse();
    const next = jest.fn();

    const middleware = authorize("admin");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("is not authorized to access this route"),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("gọi next() nếu role hợp lệ", () => {
    const req = mockRequest({ user: { role: "customer" } });
    const res = mockResponse();
    const next = jest.fn();

    const middleware = authorize("customer", "admin");

    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
