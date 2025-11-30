import { createHttpMetrics, collectDefaults, register } from '../metrics/metrics.js';

describe('metrics middleware', () => {
  test('middleware records metrics without throwing', (done) => {
    collectDefaults(1000);
    const { middleware } = createHttpMetrics('test-service');

    // Minimal mock req/res
    const req = { method: 'GET', route: { path: '/test' }, path: '/test' };
    const listeners = {};
    const res = {
      statusCode: 200,
      on: (event, fn) => { listeners[event] = fn; },
      emitFinish: () => { if (listeners['finish']) listeners['finish'](); }
    };

    middleware(req, res, () => {
      // simulate finishing the response
      res.emitFinish();
      // Query metrics to ensure register contains our metrics
      register.getMetricsAsJSON().then((metrics) => {
        const names = metrics.map(m => m.name);
        expect(names).toContain('http_request_duration_seconds');
        expect(names).toContain('http_requests_total');
        done();
      }).catch(done);
    });
  });
});
