// mockModelFactory: returns a lightweight mock for Mongoose-like models.
// The factory will prefer `jest.fn()` when running inside Jest, otherwise
// it falls back to simple async stubs so the helpers are safe outside test runner.
export function createMockModel(overrides = {}) {
  const makeFn = () => {
    if (typeof jest !== 'undefined' && typeof jest.fn === 'function') return jest.fn();
    // fallback: a dummy async function that resolves to null
    return async () => null;
  };

  const model = {
    findOne: makeFn(),
    create: makeFn(),
    findById: makeFn(),
    find: makeFn(),
    updateOne: makeFn(),
    deleteOne: makeFn(),
    countDocuments: makeFn(),
    // helpers to allow using instance-like methods in tests
    instance: () => ({ save: makeFn() }),
    ...overrides,
  };

  return model;
}

export default createMockModel;
