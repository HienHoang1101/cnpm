import { jest } from "@jest/globals";

export const mockRequest = (overrides = {}) => ({
  headers: {},
  body: {},
  params: {},
  query: {},
  user: null,
  ...overrides,
});

export const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json  = jest.fn().mockReturnValue(res);
  return res;
};
