import request from 'supertest';
import app from '../app.js';

describe('Order service basic endpoints', () => {
  test('GET /health returns 200 and service name', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service');
    expect(res.body.service).toMatch(/order/i);
  });

  test('GET /metrics returns prometheus metrics text', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    // metrics endpoint should return text content
    expect(res.headers['content-type']).toMatch(/text\//i);
    expect(res.text.length).toBeGreaterThan(0);
  });
});
