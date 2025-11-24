import branchAdminRoute from '../routes/branchAdminRoute.js';

describe('Restaurant branch admin routes', () => {
  test('should contain add, login, get, put, delete routes', () => {
    const routes = branchAdminRoute.stack.filter(s => s.route).map(s => ({ path: s.route.path, methods: Object.keys(s.route.methods) }));
    expect(routes.some(r => r.path === '/add' && r.methods.includes('post'))).toBe(true);
    expect(routes.some(r => r.path === '/login' && r.methods.includes('post'))).toBe(true);
    expect(routes.some(r => r.path === '/' && r.methods.includes('get'))).toBe(true);
  });
});
