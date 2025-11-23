import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import authRoutes from '../routes/authRoutes.js';

// Create a small express app for testing the routes
const app = express();
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

describe('Auth controller routes (smoke/unit)', () => {
  test('GET /api/auth/validate-token without token should return 401', async () => {
    const res = await request(app).get('/api/auth/validate-token');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('POST /api/auth/login with missing fields returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});
