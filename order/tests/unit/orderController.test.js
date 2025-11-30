import { jest } from '@jest/globals';

// --- 1. MOCK CÁC DEPENDENCIES ---
// Giả lập Axios để không gọi API thật sang Restaurant/Notification Service
jest.unstable_mockModule('axios', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Giả lập Mongoose Model (Order)
const mockOrderSave = jest.fn();
const MockOrder = jest.fn().mockImplementation((data) => {
  return { 
    ...data, 
    _id: 'mock_order_id', 
    save: mockOrderSave // Hàm save giả
  };
});

jest.unstable_mockModule('../../model/order.js', () => ({
  default: MockOrder,
}));

// Giả lập Mongoose Model (CartItem)
jest.unstable_mockModule('../../model/cartItem.js', () => ({
  default: {
    find: jest.fn(),
    deleteMany: jest.fn(),
  },
}));

// Import lại các module sau khi đã mock
const axios = (await import('axios')).default;
const Order = (await import('../../model/order.js')).default;
const CartItem = (await import('../../model/cartItem.js')).default;

// Import controller after mocks are in place
const { createOrder } = await import('../../controller/orderController.js');

// --- 2. BẮT ĐẦU VIẾT TEST CASE ---
describe('Order Controller - createOrder', () => {
  let req, res;

  beforeEach(() => {
    // Reset lại các mock trước mỗi bài test
    jest.clearAllMocks();

    // Provide global config URLs expected by controller
    global.gConfig = {
      restaurant_url: 'http://restaurant',
      admin_url: 'http://admin',
      notification_url: 'http://notification',
    };

    // Giả lập Request từ user
    req = {
      user: {
        id: 'user_123',
        name: 'Nguyen Van A',
        email: 'test@example.com',
        phone: '0987654321',
        address: { latitude: 10, longitude: 20 }
      },
      headers: { authorization: 'Bearer token_fake' },
      body: {
        type: 'DELIVERY',
        paymentMethod: 'CASH'
      }
    };

    // Giả lập Response
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  test('Should calculate TOTAL AMOUNT correctly (Subtotal + Tax + Delivery Fee)', async () => {
    // --- BỐI CẢNH (GIVEN) ---
    
    // 1. Giả lập giỏ hàng có 2 món
    const mockCartItems = [
      { 
        customerId: 'user_123', 
        restaurantId: 'rest_01', 
        itemId: 'dish_1', 
        quantity: 2, 
        itemPrice: 50, // Giá gốc 50 -> Tổng món này 100
        totalPrice: 100 
      },
      { 
        customerId: 'user_123', 
        restaurantId: 'rest_01', 
        itemId: 'dish_2', 
        quantity: 1, 
        itemPrice: 30, // Giá gốc 30
        totalPrice: 30 
      }
    ];
    // => Tổng phụ (Subtotal) mong đợi = 130
    CartItem.find.mockResolvedValue(mockCartItems);

    // 2. Giả lập thông tin nhà hàng (để lấy phí ship)
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/restaurants/rest_01/dishes')) {
        // Mock API lấy danh sách món ăn
        return Promise.resolve({
          data: {
            dishes: [
              { _id: 'dish_1', name: 'Phở Bò', price: 50 },
              { _id: 'dish_2', name: 'Trà Đá', price: 30 }
            ]
          }
        });
      }
      if (url.includes('/api/restaurants/rest_01')) {
        // Mock API lấy thông tin nhà hàng (phí ship = 15)
        return Promise.resolve({
          data: {
            _id: 'rest_01',
            name: 'Phở Ngon',
            ownerId: 'owner_1',
            deliveryFee: 15, // Phí ship
            address: { coordinates: { lat: 10, lng: 20 } },
            imageUrls: ['img.jpg']
          }
        });
      }
    });

    // Mock hàm save của order trả về object đã lưu
    mockOrderSave.mockImplementation(function() {
      return Promise.resolve({
        ...this,
        restaurantOrder: { ...this.restaurantOrder, subtotal: this.restaurantOrder.subtotal }
      });
    });

    // --- HÀNH ĐỘNG (WHEN) ---
    await createOrder(req, res);

    // --- KIỂM TRA KẾT QUẢ (THEN) ---
    
    // 1. Kiểm tra API trả về 201 Created
    expect(res.status).toHaveBeenCalledWith(201);

    // 2. Kiểm tra logic tính toán tiền
    // Subtotal = 100 + 30 = 130
    // Tax (8%) = 130 * 0.08 = 10.4
    // Delivery Fee = 15
    // => Total Amount = 130 + 10.4 + 15 = 155.4
    
    // Lấy dữ liệu Order đã được khởi tạo để kiểm tra
    const createdOrderData = MockOrder.mock.calls[0][0];
    
    console.log('Calculated Total:', createdOrderData.totalAmount); // Log ra để xem

    expect(createdOrderData.totalAmount).toBeCloseTo(155.4);
    expect(createdOrderData.restaurantOrder.subtotal).toBe(130);
    expect(createdOrderData.restaurantOrder.deliveryFee).toBe(15);
  });
});
