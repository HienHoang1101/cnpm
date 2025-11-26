import request from 'supertest';
import { jest } from '@jest/globals';

// Set environment variables used by app.js before importing
process.env.RESTAURANT_SERVICE_URL = 'http://restaurant';
process.env.ADMIN_SERVICE_URL = 'http://admin';
process.env.NOTIFICATION_SERVICE_URL = 'http://notification';
process.env.AUTH_SERVICE_URL = 'http://auth';

// Mock axios so external HTTP calls are not performed
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock CartItem model to avoid database access
jest.unstable_mockModule('../../model/cartItem.js', () => ({
  default: {
    find: jest.fn(),
    deleteMany: jest.fn().mockResolvedValue({}),
  },
}));

const axios = (await import('axios')).default;
const CartItem = (await import('../../model/cartItem.js')).default;

// Import app after setting env and mocks
const app = (await import('../../app.js')).default;
const Order = (await import('../../model/order.js')).default;

describe('Integration Test: Order API', () => {
  beforeAll(() => {
    // nothing for now
  });

  it('POST /api/orders - Should create order successfully', async () => {
    // Mock auth token validation
    axios.get.mockImplementation((url, opts) => {
      if (url.includes('/api/auth/validate-token')) {
        return Promise.resolve({ data: { user: {
          id: 'user_123', role: 'customer', name: 'Nguyen Van A', email: 'test@example.com', phone: '0987654321', address: { latitude: 10, longitude: 20 }
        } } });
      }

      // dishes endpoint must be checked first (more specific)
      if (url.includes('/api/restaurants/rest_01/dishes')) {
        return Promise.resolve({ data: { dishes: [ { _id: 'dish_1', name: 'Phở Bò', price: 50 }, { _id: 'dish_2', name: 'Trà Đá', price: 30 } ] } });
      }

      // restaurant info
      if (url.includes('/api/restaurants/rest_01')) {
        return Promise.resolve({ data: { _id: 'rest_01', name: 'Phở Ngon', ownerId: 'owner_1', deliveryFee: 15, address: { coordinates: { lat: 10, lng: 20 } }, imageUrls: ['img.jpg'] } });
      }

      return Promise.resolve({ data: {} });
    });

    // Mock CartItem.find to return two items
    CartItem.find.mockResolvedValue([
      { customerId: 'user_123', restaurantId: 'rest_01', itemId: 'dish_1', quantity: 2, itemPrice: 50, totalPrice: 100 },
      { customerId: 'user_123', restaurantId: 'rest_01', itemId: 'dish_2', quantity: 1, itemPrice: 30, totalPrice: 30 },
    ]);

    // Spy on Order.prototype.save to avoid DB
    const saveSpy = jest.spyOn(Order.prototype, 'save').mockResolvedValue({
      _id: 'mock_order_id',
      orderId: 'ORD-123456',
      totalAmount: 155.4,
      restaurantOrder: { status: 'PLACED', subtotal: 130, deliveryFee: 15, tax: 10.4 },
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', 'Bearer mock_token')
      .send({ type: 'DELIVERY', paymentMethod: 'CASH' });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('message', 'Order placed successfully');
    expect(res.body.order).toHaveProperty('orderId');

    saveSpy.mockRestore();
  });
});

