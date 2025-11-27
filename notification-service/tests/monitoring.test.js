import { collectDefaults, register } from '../../monitoring/metrics/metrics.js';

describe('Monitoring helper - notification-service', () => {
  test('collectDefaults registers process metrics', async () => {
    collectDefaults();
    const metrics = await register.getMetricsAsJSON();
    const names = metrics.map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining(['process_cpu_user_seconds_total']));
  });
});
