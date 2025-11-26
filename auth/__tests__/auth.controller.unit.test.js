import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

// Use ESM mock helper (top-level await supported in Jest ESM)
await jest.unstable_mockModule('../model/User.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

const { default: User } = await import('../model/User.js');
const { default: authRoutes } = await import('../routes/authRoutes.js');

// Create a small express app for testing the routes
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth controller - deeper unit tests (with mocked User)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('POST /api/auth/register returns 400 if user already exists', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing' });

    const res = await request(app).post('/api/auth/register').send({
      email: 'exists@example.com',
      password: 'password',
      name: 'Existing',
      phone: '123456',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(User.findOne).toHaveBeenCalledWith({ email: 'exists@example.com' });
  });

  test('POST /api/auth/register success path creates user and returns token', async () => {
    User.findOne.mockResolvedValue(null);

    // prepare a fake user instance returned by User.create()
    const fakeUser = {
      _id: 'user123',
      email: 'new@example.com',
      name: 'New User',
      role: 'customer',
      generateAuthToken: jest.fn().mockReturnValue('jwt-token'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      save: jest.fn().mockResolvedValue(true),
      toObject: function () {
        return { _id: this._id, email: this.email, name: this.name, role: this.role };
      },
    };

    User.create.mockResolvedValue(fakeUser);

    const res = await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'password',
      name: 'New User',
      phone: '999999',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token', 'jwt-token');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(User.create).toHaveBeenCalled();
  });

  test('POST /api/auth/login returns 401 when credentials invalid', async () => {
    // simulate findOne(...).select(...) returning null
    User.findOne.mockImplementation(() => ({ select: () => Promise.resolve(null) }));

    const res = await request(app).post('/api/auth/login').send({
      email: 'noone@example.com',
      password: 'pw',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/login success path returns token and sets cookie', async () => {
    // create fake user with comparePassword and helpers
    const fakeUser = {
      _id: 'loginUser',
      email: 'login@example.com',
      name: 'Login',
      status: 'active',
      comparePassword: jest.fn().mockResolvedValue(true),
      generateAuthToken: jest.fn().mockReturnValue('jwt-login'),
      generateRefreshToken: jest.fn().mockReturnValue('refresh-login'),
      save: jest.fn().mockResolvedValue(true),
      toObject: function () {
        return { _id: this._id, email: this.email, name: this.name };
      },
    };

    // User.findOne(...).select('+password') -> returns the user
    User.findOne.mockImplementation(() => ({ select: () => Promise.resolve(fakeUser) }));

    const res = await request(app).post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'validpw',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token', 'jwt-login');
    expect(res.headers['set-cookie']).toBeDefined();
    expect(fakeUser.comparePassword).toHaveBeenCalledWith('validpw');
  });
});
