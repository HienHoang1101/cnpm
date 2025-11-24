import ownerRoute from '../routes/ResturantOwnerRoute.js';

describe('Restaurant owner routes', () => {
  test('should expose /restaurants add and get endpoints', () => {
    const routes = ownerRoute.stack.filter(s => s.route).map(s => ({ path: s.route.path, methods: Object.keys(s.route.methods) }));
    expect(routes.some(r => r.path === '/restaurants/add' && r.methods.includes('post'))).toBe(true);
    expect(routes.some(r => r.path === '/restaurants/' && r.methods.includes('get'))).toBe(true);
  });
});
