import http from 'k6/http';
import { sleep } from 'k6';

// Staged ramp to 1000 concurrent VUs (safe approach)
export const options = {
  stages: [
    { duration: '30s', target: 200 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 1000 }, // hold 1000 VUs for 30s
    { duration: '30s', target: 0 },
  ],
};

// Alternative: direct 1000 VUs for 30s (very aggressive)
// export const options = { vus: 1000, duration: '30s' };

export default function () {
  // Adjust the URL to your service host/port. If order-service is mapped to host port 52358,
  // change to 'http://localhost:52358/metrics'. Use the correct host:port from `docker-compose ps`.
  http.get('http://localhost:52358/metrics');
  sleep(1);
}
/////