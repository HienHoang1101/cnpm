import notificationRoutes from '../routes/notificationRoutes.js';

describe('Notification routes presence', () => {
  test('should define public routes /email and /sms', () => {
    const routes = notificationRoutes.stack
      .filter((s) => s.route)
      .map((s) => ({ path: s.route.path, methods: Object.keys(s.route.methods) }));

    const hasEmail = routes.some(r => r.path === '/email' && r.methods.includes('post'));
    const hasSms = routes.some(r => r.path === '/sms' && r.methods.includes('post'));

    expect(hasEmail).toBe(true);
    expect(hasSms).toBe(true);
  });
});
