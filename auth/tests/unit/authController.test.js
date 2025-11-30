import { jest } from '@jest/globals';

// --- 1. MOCK CÁC DEPENDENCIES ---
// Giả lập User Model và các phương thức của nó
const mockUserInstance = {
  generateAuthToken: jest.fn().mockReturnValue('mock_token'),
  generateRefreshToken: jest.fn().mockReturnValue('mock_refresh_token'),
  comparePassword: jest.fn(),
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({ _id: 'user_123', email: 'test@example.com', role: 'customer' }),
  status: 'active'
};

const mockUserClass = {
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

// Mock module User
jest.unstable_mockModule('../../model/User.js', () => ({
  default: mockUserClass
}));

// Import Controller sau khi đã Mock
const { register, login, getCurrentUser } = await import('../../controller/authController.js');

describe('Auth Controller Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mock trước mỗi test
    
    // Giả lập Request và Response
    req = {
      body: {},
      user: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn()
    };
  });

  // --- TEST REGISTER ---
  describe('register', () => {
    test('Should register new user successfully', async () => {
      req.body = { email: 'new@example.com', password: '123', name: 'User' };
      
      // Giả lập không tìm thấy user cũ (chưa tồn tại)
      mockUserClass.findOne.mockResolvedValue(null);
      // Giả lập tạo user mới thành công
      mockUserClass.create.mockResolvedValue(mockUserInstance);

      await register(req, res);

      expect(mockUserClass.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mock_token'
      }));
    });

    test('Should return 400 if user already exists', async () => {
      req.body = { email: 'exist@example.com' };
      
      // Giả lập tìm thấy user
      mockUserClass.findOne.mockResolvedValue({ _id: 'existing_id' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('already exists')
      }));
    });
  });

  // --- TEST LOGIN ---
  describe('login', () => {
    test('Should login successfully with correct credentials', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };

      // Setup mock user cho login
      const loginUserMock = { ...mockUserInstance, comparePassword: jest.fn().mockResolvedValue(true) };
      
      // Mock chain: findOne().select()
      const mockSelect = jest.fn().mockResolvedValue(loginUserMock);
      mockUserClass.findOne.mockReturnValue({ select: mockSelect });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.cookie).toHaveBeenCalled(); // Kiểm tra có set cookie refresh token
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        token: 'mock_token'
      }));
    });

    test('Should return 401 for invalid password', async () => {
      req.body = { email: 'test@example.com', password: 'wrong' };

      const loginUserMock = { ...mockUserInstance, comparePassword: jest.fn().mockResolvedValue(false) };
      const mockSelect = jest.fn().mockResolvedValue(loginUserMock);
      mockUserClass.findOne.mockReturnValue({ select: mockSelect });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  // --- TEST GET CURRENT USER ---
  describe('getCurrentUser', () => {
    test('Should return user data when found', async () => {
      req.user = { id: 'user_123' };
      mockUserClass.findById.mockResolvedValue({ _id: 'user_123', name: 'Test' });

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        user: expect.anything()
      }));
    });

    test('Should return 404 if user not found', async () => {
      req.user = { id: 'unknown_id' };
      mockUserClass.findById.mockResolvedValue(null);

      await getCurrentUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
