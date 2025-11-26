import request from 'supertest';
import app from '../app.js';

describe('Order service basic endpoints', () => {
  test('GET /health returns status 200', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'order-service');
  });

  test('GET /metrics returns prometheus metrics text', async () => {
    const res = await request(app).get('/metrics').expect(200);
    expect(res.headers['content-type']).toMatch(/text\//);
    // At minimum, metrics text should include the default collect metrics registry content type
    expect(res.text.length).toBeGreaterThan(0);
  });

  test('Unknown route returns 404 JSON', async () => {
    const res = await request(app).get('/non-existent-route').expect(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });
});
