import request from 'supertest';
import app from '../index.js';

describe('Payment Service /metrics', () => {
  test('responds 200 and content-type text/plain', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\//);
    expect(res.text.length).toBeGreaterThan(0);
  }, 10000);
});
