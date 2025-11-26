import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// --- 1. MOCK CÁC DEPENDENCIES ---
// Mock Middleware Auth (để bypass khâu đăng nhập)
jest.unstable_mockModule('../../middlewares/authMiddleware.js', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'admin_1', role: 'admin' };
    next();
  },
  authorize: (...roles) => (req, res, next) => next()
}));

// Mock Model Settlement
const mockSettlement = {
  _id: 'set_123',
  restaurantId: 'rest_1',
  amountDue: 100,
  status: 'PENDING',
  weekEnding: new Date()
};

const mockSettlementModel = {
  findOneAndUpdate: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn()
};

jest.unstable_mockModule('../../model/restaurantSettlement.js', () => ({
  default: mockSettlementModel
}));

// Mock Utils
jest.unstable_mockModule('../../utils/bankTransfer.js', () => ({
  bankTransfer: jest.fn().mockResolvedValue({ reference: 'REF123' })
}));
jest.unstable_mockModule('../../utils/notificationHelper.js', () => ({
  createNotification: jest.fn()
}));

// Import Controller (Dynamic)
const settlementController = await import('../../controllers/settlementController.js');

// Setup App
const app = express();
app.use(express.json());
// Định nghĩa route thủ công để test
app.post('/api/settlements/add-order', settlementController.addOrderToSettlement);
app.post('/api/settlements/process-weekly', settlementController.processWeeklySettlements);

describe('Admin Settlement API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/settlements/add-order - Should update settlement record', async () => {
    mockSettlementModel.findOneAndUpdate.mockResolvedValue(mockSettlement);

    const res = await request(app)
      .post('/api/settlements/add-order')
      .send({
        restaurantId: 'rest_1',
        subtotal: 100,
        platformFee: 20,
        weekEnding: '2023-10-01'
      });

    expect(res.status).toBe(200);
    expect(mockSettlementModel.findOneAndUpdate).toHaveBeenCalled();
  });

  test('POST /api/settlements/process-weekly - Should process payments', async () => {
    // Mock tìm thấy các khoản chưa thanh toán
    mockSettlementModel.find.mockResolvedValue([mockSettlement]);
    // Mock update thành công
    mockSettlementModel.findByIdAndUpdate.mockResolvedValue({ ...mockSettlement, status: 'PAID' });

    const res = await request(app)
      .post('/api/settlements/process-weekly');

    expect(res.status).toBe(200);
    expect(res.body.successful).toBe(1);
  });
});
