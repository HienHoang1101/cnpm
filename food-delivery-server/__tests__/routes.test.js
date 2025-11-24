const router = require('../routes/authRoutes.js');

describe('Server auth routes (commonjs)', () => {
  test('should have register and login routes', () => {
    const routes = router.stack.filter(s => s.route).map(s => ({ path: s.route.path, methods: Object.keys(s.route.methods) }));
    expect(routes.some(r => r.path === '/register' && r.methods.includes('post'))).toBe(true);
    expect(routes.some(r => r.path === '/login' && r.methods.includes('post'))).toBe(true);
  });
});
