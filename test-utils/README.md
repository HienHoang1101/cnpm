Test utilities for unit tests

Files:

- `createApp.js`: helper that builds a minimal Express `app` and mounts a router under `/api`.
- `mockModelFactory.js`: produces a lightweight mock compatible with Mongoose-style model methods. When running inside Jest, the returned functions are `jest.fn()` so you can assert calls; otherwise they are safe async stubs.

Usage example (ESM/Jest):

```js
import { createApp } from '../../test-utils/createApp.js';
import createMockModel from '../../test-utils/mockModelFactory.js';

const User = createMockModel();
User.findOne.mockResolvedValue(null);

// Create your router after mocking models so controllers import the mocked module
const { default: authRoutes } = await import('../auth/routes/authRoutes.js');
const app = createApp(authRoutes);

// then use supertest: request(app).post('/api/auth/register').send({...})
```

Keep mocks local to each test and call `jest.resetAllMocks()` in `beforeEach()` when needed.
