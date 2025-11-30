import http from 'k6/http';
import { check, sleep } from 'k6';

// Default: 100 virtual users for 30s. You can override with k6 CLI flags.
export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS) : 100,
  duration: __ENV.DURATION || '30s',
};

const TARGET = __ENV.TARGET_URL || 'http://localhost:52357';
const EMAIL = __ENV.EMAIL || 'admin@example.com';
const PASSWORD = __ENV.PASSWORD || 'changeme';

export default function () {
  const url = `${TARGET}/api/auth/login`;
  const payload = JSON.stringify({ email: EMAIL, password: PASSWORD });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'has token': (r) => r.json && r.json('token') !== undefined,
  });

  // small random sleep to simulate user think time
  sleep(Math.random() * 2);
}
