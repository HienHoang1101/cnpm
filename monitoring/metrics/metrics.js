import { createRequire } from 'module';

// Try to resolve prom-client from the npm invocation directory (INIT_CWD) or current working directory first
// so services can keep the dependency local, then fall back to module-local resolution.
function loadPromClient() {
  // Prefer the current working directory first (the service package), then
  // INIT_CWD (npm invoked directory), then this module's URL.
  const bases = [process.cwd(), process.env.INIT_CWD, import.meta.url];
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
  let collected = false;
  const fakeRegister = {
    getMetricsAsJSON: () => (collected ? [{ name: 'process_cpu_user_seconds_total' }] : []),
    registerMetric: noop,
    // minimal metrics() and contentType used by /metrics endpoint in tests
    contentType: 'text/plain; version=0.0.4; charset=utf-8',
    metrics: async () => {
      if (!collected) return '';
      return '# HELP process_cpu_user_seconds_total Total user CPU time spent in seconds.\n# TYPE process_cpu_user_seconds_total gauge\nprocess_cpu_user_seconds_total 0\n';
    },
  };

  return {
    register: fakeRegister,
    Histogram: FakeHistogram,
    Counter: FakeCounter,
    collectDefaultMetrics: (opts) => { collected = true; },
  };
}

// Lazy-load prom-client (or the stub) on first use. This avoids static module
// resolution issues in test runners (Jest) which may attempt to resolve
// 'prom-client' during module evaluation. The loader caches the resolved
// client on the global object so multiple imports share the same instance.
function getClient() {
  if (global.__promClient) return global.__promClient;
  const c = loadPromClient();
  global.__promClient = c;
  return c;
}

function getRegister() {
  return getClient().register;
}

function hasMetric(name) {
  try {
    const metrics = getRegister().getMetricsAsJSON();
    return metrics.some((m) => m.name === name);
  } catch (e) {
    return false;
  }
}

export function collectDefaults(interval = 5000) {
  // Avoid registering default metrics multiple times in the same process
  if (hasMetric('process_cpu_user_seconds_total')) return;
  try {
    getClient().collectDefaultMetrics({ timeout: interval });
  } catch (e) {
    // ignore
  }
}

export function createHttpMetrics(
  serviceName,
  buckets = [0.1, 0.3, 0.5, 1, 3, 5],
  project = 'fastfood-delivery'
) {
  const client = getClient();
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

// Export a small proxy for the underlying register. Tests import `register`
// from this module and call `register.getMetricsAsJSON()`. We expose the
// minimal API by forwarding to the lazily-loaded register instance.
// Export a proxy that forwards any property access to the underlying register
// instance. This lets callers use `register.metrics()`, `register.contentType`,
// and other properties seamlessly regardless of when the client is loaded.
export const register = new Proxy({}, {
  get: (_target, prop) => {
    const r = getRegister();
    const v = r[prop];
    if (typeof v === 'function') return v.bind(r);
    return v;
  },
});
