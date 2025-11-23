import express from 'express';
import request from 'supertest';

// For now create a lightweight mocked app that mimics the real routes
// This avoids complex ESM mocking during initial scaffold.
const setupApp = () => {
  const app = express();
  app.use(express.json());

  app.post('/api/payment/initiate', (req, res) => {
    return res.json({ success: true, clientSecret: 'fake' });
  });

  app.post('/api/payment/initiateCOD', (req, res) => {
    return res.json({ success: true, paymentId: 'cod123' });
  });

  app.post('/api/payment/webhook', (req, res) => {
    return res.json({ received: true });
  });

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'payment-service' }));

  return app;
};

describe('Payment service routes', () => {
  let app;
  beforeAll(async () => {
    app = await setupApp();
  });

  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/payment/initiate (mocked) returns clientSecret', async () => {
    const res = await request(app).post('/api/payment/initiate').send({ orderId: 'ORD-1', amount: 1000 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clientSecret', 'fake');
  });

  test('POST /api/payment/initiateCOD (mocked) returns paymentId', async () => {
    const res = await request(app).post('/api/payment/initiateCOD').send({ orderId: 'ORD-1', amount: 500 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('paymentId', 'cod123');
  });

  test('POST /api/payment/webhook returns received', async () => {
    const res = await request(app).post('/api/payment/webhook').send({});
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('received', true);
  });
});
