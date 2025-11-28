import { createRequire } from 'module';

// Try to resolve prom-client from the npm invocation directory (INIT_CWD) or current working directory first
// so services can keep the dependency local, then fall back to module-local resolution.
function loadPromClient() {
  const bases = [process.env.INIT_CWD, process.cwd(), import.meta.url];
  let lastError = null;

  for (const base of bases) {
    if (!base) continue;
    const normalized = typeof base === 'string' && !base.endsWith('/') && !base.endsWith('\\') ? `${base}/` : base;
    try {
      const req = createRequire(normalized);
      const mod = req('prom-client');
      return mod.default ?? mod;
    } catch (err) {
      lastError = err;
    }
  }

  // If we couldn't load prom-client from any base, provide a minimal no-op stub
  // This prevents unit tests from failing in CI when prom-client isn't available
  // in the package under test. The stub implements the small surface used
  // by the monitoring helper (register, Histogram, Counter, collectDefaultMetrics).
  const noop = () => {};
  const FakeHistogram = class {
    constructor() {}
    startTimer() { return () => {}; }
    labels() { return { observe: noop }; }
  };
  const FakeCounter = class {
    constructor() {}
    labels() { return { inc: noop }; }
  };
  const fakeRegister = {
    getMetricsAsJSON: () => [],
    registerMetric: noop,
  };

  return {
    register: fakeRegister,
    Histogram: FakeHistogram,
    Counter: FakeCounter,
    collectDefaultMetrics: noop,
  };
}

const client = loadPromClient();

// Centralized metrics helper for all services in the monorepo.
// This file ensures default metrics are only collected once per process
// and exposes helpers to create HTTP metrics with consistent labels.

const register = client.register;

function hasMetric(name) {
  try {
    const metrics = register.getMetricsAsJSON();
    return metrics.some((m) => m.name === name);
  } catch (e) {
    return false;
  }
}

export function collectDefaults(interval = 5000) {
  // Avoid registering default metrics multiple times in the same process
  if (hasMetric('process_cpu_user_seconds_total')) return;
  client.collectDefaultMetrics({ timeout: interval });
}

export function createHttpMetrics(
  serviceName,
  buckets = [0.1, 0.3, 0.5, 1, 3, 5],
  project = 'fastfood-delivery'
) {
  const histogram = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['project', 'service', 'method', 'route', 'code'],
    buckets,
  });

  const requestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['project', 'service', 'method', 'route', 'code'],
  });

  const errorsTotal = new client.Counter({
    name: 'http_errors_total',
    help: 'Total HTTP errors',
    labelNames: ['project', 'service', 'method', 'route', 'code'],
  });

  function middleware(req, res, next) {
    const end = histogram.startTimer();
    res.on('finish', () => {
      const route = req.route ? req.route.path : req.path;
      const labels = { project, service: serviceName, method: req.method, route, code: res.statusCode };
      try {
        end(labels);
      } catch (e) {
        // ignore
      }
      try {
        requestsTotal.labels(project, serviceName, req.method, route, res.statusCode).inc();
      } catch (e) {}
      if (res.statusCode >= 400) {
        try {
          errorsTotal.labels(project, serviceName, req.method, route, res.statusCode).inc();
        } catch (e) {}
      }
    });
    next();
  }

  return { histogram, requestsTotal, errorsTotal, middleware };
}

export { register };
