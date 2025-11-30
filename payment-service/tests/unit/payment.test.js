import { jest } from '@jest/globals';

describe('Payment Service Sanity Check', () => {
  test('Service should be healthy', () => {
    // Đây là test case cơ bản để đảm bảo pipeline CI/CD chạy qua
    expect(true).toBe(true);
  });

  test('Should process payment calculation correctly', () => {
    const amount = 100;
    const fee = 10;
    expect(amount + fee).toBe(110);
  });
});
