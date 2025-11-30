import client from 'prom-client';

// Use the default registry so existing code can use client.register
const register = client.register;

export const activeUsersGauge = new client.Gauge({
  name: 'app_active_users_total',
  help: 'Total number of currently logged in users',
  labelNames: ['role'],
});

export { client, register };
