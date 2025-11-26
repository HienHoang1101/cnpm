import router from '../routes/restaurantPaymentRoutes.js';

describe('Admin service routes', () => {
  test('has add-order, root GET and process-weekly routes', () => {
    const routes = router.stack.filter(s => s.route).map(s => ({ path: s.route.path, methods: Object.keys(s.route.methods) }));
    expect(routes.some(r => r.path === '/add-order' && r.methods.includes('post'))).toBe(true);
    expect(routes.some(r => r.path === '/' && r.methods.includes('get'))).toBe(true);
    expect(routes.some(r => r.path === '/process-weekly' && r.methods.includes('post'))).toBe(true);
  });
});
