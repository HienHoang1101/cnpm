import { protect } from '../middleware/auth.js';

// We will unit test protect by calling it with a fake req/res/next
describe('Auth middleware', () => {
  test('protect should return 401 when no Authorization header', async () => {
    const req = { headers: {} };
    let statusCalledWith = null;
    let jsonCalled = false;
    const res = {
      status: function (code) { statusCalledWith = code; return this; },
      json: function () { jsonCalled = true; return this; }
    };
    const next = function () { throw new Error('next should not be called'); };

    await protect(req, res, next);

    expect(statusCalledWith).toBe(401);
    expect(jsonCalled).toBe(true);
  });
});
