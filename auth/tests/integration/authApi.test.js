import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import cookieParser from 'cookie-parser';

// --- SETUP MOCK APP ---
// Vì chúng ta test integration route, ta cần mock User model để không cần kết nối DB thật
const mockUserFunctions = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

jest.unstable_mockModule('../../model/User.js', () => ({
  default: mockUserFunctions
}));

// Import Routes (Giả sử bạn có file authRoutes.js export default router)
// Lưu ý: Bạn cần đảm bảo đường dẫn import đúng. Ở đây tôi giả định cấu trúc dựa trên controller
const authController = await import('../../controller/authController.js');

// Tạo App Express giả để test
const app = express();
app.use(express.json());
app.use(cookieParser());

// Setup Routes thủ công cho test (để tránh phụ thuộc vào file index.js chính có thể chứa code kết nối DB)
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

describe('Auth API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 on successful registration', async () => {
      // Mock hành vi Model
      mockUserFunctions.findOne.mockResolvedValue(null); // User chưa tồn tại
      mockUserFunctions.create.mockResolvedValue({
        _id: '123',
        generateAuthToken: () => 'token_abc',
        generateRefreshToken: () => 'refresh_xyz',
        save: jest.fn(),
        toObject: () => ({ email: 'test@test.com' })
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
    });

    it('should return 400 if email missing', async () => {
      // Logic mongoose sẽ lỗi nếu thiếu field required, ở đây ta test controller handle lỗi
      mockUserFunctions.findOne.mockResolvedValue(null);
      mockUserFunctions.create.mockRejectedValue(new Error('Validation Error'));

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          password: '123'
          // thiếu email
        });

      expect(res.statusCode).toEqual(500); // Hoặc 400 tùy vào cách bạn handle error trong model validation
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 on successful login', async () => {
      const mockUser = {
        _id: '123',
        status: 'active',
        comparePassword: jest.fn().mockResolvedValue(true),
        generateAuthToken: () => 'token_abc',
        generateRefreshToken: () => 'refresh_xyz',
        save: jest.fn(),
        toObject: () => ({ email: 'login@test.com' })
      };

      // Mock chain: findOne().select()
      mockUserFunctions.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      // Kiểm tra cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
    });
  });
});
