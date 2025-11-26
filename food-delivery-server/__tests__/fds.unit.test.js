const request = require('supertest');
const express = require('express');
const client = require('prom-client');

describe('Food-delivery-server unit tests (scaffold)', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.get('/health', (req, res) => res.json({ status: 'ok', service: 'delivery-service' }));
    app.get('/metrics', async (req, res) => {
      res.set('Content-Type', client.register.contentType);
      res.end(await client.register.metrics());
    });
    client.collectDefaultMetrics();
  });

  afterAll(() => {
    try { client.register.clear(); } catch (e) { /* ignore */ }
  });

  test('health endpoint returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service');
  });

  test('metrics endpoint returns Prometheus metrics text', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });
});
