import client from 'prom-client';

// Helper to create standard HTTP metrics for a service
export function createHttpMetrics(serviceName, buckets = [0.1, 0.3, 0.5, 1, 3, 5]) {
  const histogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['service', 'method', 'route', 'code'],
    buckets,
  });

  const requestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['service', 'method', 'route', 'code'],
  });

  const errorsTotal = new client.Counter({
    name: 'http_errors_total',
    help: 'Total HTTP errors',
    labelNames: ['service', 'method', 'route', 'code'],
  });

  function middleware(req, res, next) {
    const end = histogram.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      const labels = { service: serviceName, method: req.method, route, code: res.statusCode };
      try {
        end(labels);
      } catch (e) {
        // ignore
      }
      try {
        requestsTotal.labels(serviceName, req.method, route, res.statusCode).inc();
      } catch (e) {}
      if (res.statusCode >= 400) {
        try {
          errorsTotal.labels(serviceName, req.method, route, res.statusCode).inc();
        } catch (e) {}
      }
    });
    next();
  }

  return { histogram, requestsTotal, errorsTotal, middleware };
}

export const register = client.register;
export function collectDefaults(interval = 5000) {
  client.collectDefaultMetrics({ timeout: interval });
}
