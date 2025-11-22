# Test Cases - Food Delivery System

Tài liệu này mô tả các test cases cần thiết cho hệ thống Food Delivery, bao gồm unit tests, integration tests, end-to-end tests, và monitoring/health checks.

## Mục lục

1. [Unit Tests](#unit-tests)
2. [Integration Tests](#integration-tests)
3. [End-to-End Tests](#e2e-tests)
4. [Health Checks & Monitoring Tests](#health-checks--monitoring-tests)
5. [Hướng dẫn chạy tests](#hướng-dẫn-chạy-tests)

---

## Unit Tests

Unit tests kiểm tra các thành phần riêng lẻ (functions, classes, modules) độc lập với dependencies.

### Auth Service

#### User Registration
- **TC-AUTH-001**: Đăng ký user với thông tin hợp lệ
  - Input: email, password, name, phone
  - Expected: User được tạo thành công, password được hash
  
- **TC-AUTH-002**: Đăng ký với email đã tồn tại
  - Input: email đã có trong DB
  - Expected: Trả về lỗi "Email already exists"
  
- **TC-AUTH-003**: Đăng ký với email không hợp lệ
  - Input: email không đúng format
  - Expected: Validation error

- **TC-AUTH-004**: Đăng ký với password yếu
  - Input: password < 6 ký tự
  - Expected: Validation error

#### User Authentication
- **TC-AUTH-005**: Login với credentials đúng
  - Input: email, password hợp lệ
  - Expected: Trả về JWT token
  
- **TC-AUTH-006**: Login với password sai
  - Input: email đúng, password sai
  - Expected: Authentication error
  
- **TC-AUTH-007**: Login với email không tồn tại
  - Input: email chưa đăng ký
  - Expected: User not found error

#### JWT Token Management
- **TC-AUTH-008**: Tạo JWT token với payload hợp lệ
  - Input: userId, role
  - Expected: Token được tạo và verify được
  
- **TC-AUTH-009**: Verify token hợp lệ
  - Input: Valid JWT token
  - Expected: Decode được user info
  
- **TC-AUTH-010**: Verify token đã expired
  - Input: Expired token
  - Expected: Token expired error

### Order Service

#### Order Creation
- **TC-ORDER-001**: Tạo order với items hợp lệ
  - Input: userId, restaurantId, items[]
  - Expected: Order được tạo với status "pending"
  
- **TC-ORDER-002**: Tạo order với cart rỗng
  - Input: items = []
  - Expected: Validation error

- **TC-ORDER-003**: Tính tổng giá order chính xác
  - Input: Multiple items với quantity khác nhau
  - Expected: Total = sum(item.price * item.quantity)

#### Order Status Management
- **TC-ORDER-004**: Cập nhật order status hợp lệ
  - Input: orderId, status = "confirmed"
  - Expected: Order status được cập nhật
  
- **TC-ORDER-005**: Cập nhật status không hợp lệ
  - Input: orderId, status = "invalid_status"
  - Expected: Validation error

- **TC-ORDER-006**: Chuyển đổi order status theo flow
  - Input: pending → confirmed → preparing → ready → delivered
  - Expected: Mỗi chuyển đổi hợp lệ

#### Order Query
- **TC-ORDER-007**: Lấy orders theo userId
  - Input: userId
  - Expected: Trả về danh sách orders của user
  
- **TC-ORDER-008**: Lấy order detail theo orderId
  - Input: valid orderId
  - Expected: Trả về order với đầy đủ thông tin

### Payment Service

#### Payment Processing
- **TC-PAY-001**: Xử lý payment với Stripe token hợp lệ
  - Input: amount, token, orderId
  - Expected: Payment success, charge created
  
- **TC-PAY-002**: Xử lý payment với token không hợp lệ
  - Input: invalid token
  - Expected: Payment failed error

- **TC-PAY-003**: Xử lý payment với amount = 0
  - Input: amount = 0
  - Expected: Validation error

#### Payment Record
- **TC-PAY-004**: Lưu payment record vào DB
  - Input: payment details
  - Expected: Payment record được tạo
  
- **TC-PAY-005**: Kiểm tra payment status
  - Input: paymentId
  - Expected: Trả về status (success/failed/pending)

### Notification Service

#### Email Notifications
- **TC-NOTIF-001**: Gửi email xác nhận đơn hàng
  - Input: orderId, userEmail
  - Expected: Email được gửi thành công
  
- **TC-NOTIF-002**: Gửi email với template đúng
  - Input: order details
  - Expected: Email content chứa đầy đủ thông tin order

#### SMS Notifications
- **TC-NOTIF-003**: Gửi SMS thông báo delivery
  - Input: phone number, message
  - Expected: SMS được gửi qua Twilio

### Food Delivery Server

#### Delivery Tracking
- **TC-DELIV-001**: Cập nhật location của delivery person
  - Input: deliveryId, lat, lng
  - Expected: Location được cập nhật real-time
  
- **TC-DELIV-002**: Gán delivery person cho order
  - Input: orderId, deliveryPersonId
  - Expected: Assignment thành công

#### Real-time Updates
- **TC-DELIV-003**: Emit socket event khi order status thay đổi
  - Input: order status change
  - Expected: Socket event được broadcast tới clients

---

## Integration Tests

Integration tests kiểm tra tương tác giữa các components/services.

### Auth + Database Integration
- **TC-INT-001**: Đăng ký user và lưu vào MongoDB
  - Expected: User được persist trong DB
  
- **TC-INT-002**: Login và verify token với real DB
  - Expected: Token chứa thông tin user từ DB

### Order + Payment Integration
- **TC-INT-003**: Tạo order và xử lý payment
  - Steps: 
    1. Create order
    2. Process payment
    3. Update order status
  - Expected: Order status = "confirmed" sau khi payment success
  
- **TC-INT-004**: Order rollback khi payment failed
  - Expected: Order status = "payment_failed"

### Order + Notification Integration
- **TC-INT-005**: Gửi notification sau khi tạo order
  - Steps:
    1. Create order
    2. Trigger notification
  - Expected: Email/SMS được gửi

### Microservices Communication
- **TC-INT-006**: Auth service verify token cho Order service
  - Steps: Order service gọi Auth service để validate JWT
  - Expected: Token được verify thành công
  
- **TC-INT-007**: Order service gọi Payment service
  - Steps: HTTP request từ Order → Payment
  - Expected: Response trả về đúng format

### Kafka Event Integration
- **TC-INT-008**: Publish event khi order được tạo
  - Expected: Event được publish lên Kafka topic
  
- **TC-INT-009**: Consumer nhận và xử lý event
  - Expected: Notification service consume event và gửi notification

---

## E2E Tests

End-to-end tests kiểm tra toàn bộ user flow từ đầu đến cuối.

### User Journey: Đặt hàng thành công
- **TC-E2E-001**: Complete order flow
  - Steps:
    1. User đăng ký/login
    2. Browse restaurants
    3. Add items to cart
    4. Create order
    5. Process payment
    6. Receive confirmation
  - Expected: Order created, payment success, notification sent

### User Journey: Tracking đơn hàng
- **TC-E2E-002**: Order tracking flow
  - Steps:
    1. User login
    2. View order history
    3. Track active order
    4. Receive real-time updates
  - Expected: UI cập nhật real-time theo order status

### Restaurant Journey: Quản lý orders
- **TC-E2E-003**: Restaurant order management
  - Steps:
    1. Restaurant login
    2. View incoming orders
    3. Confirm order
    4. Update order status
  - Expected: Order status flow hoạt động đúng

### Delivery Journey: Giao hàng
- **TC-E2E-004**: Delivery person flow
  - Steps:
    1. Login as delivery person
    2. Accept delivery assignment
    3. Update location
    4. Mark as delivered
  - Expected: Order status = "delivered"

### Admin Journey: Quản trị hệ thống
- **TC-E2E-005**: Admin dashboard
  - Steps:
    1. Admin login
    2. View all orders
    3. View statistics
    4. Manage users
  - Expected: All admin functions work correctly

---

## Health Checks & Monitoring Tests

### Service Health Endpoints
- **TC-HEALTH-001**: Auth service health check
  - Endpoint: GET /health
  - Expected: 200 OK, { status: "healthy" }
  
- **TC-HEALTH-002**: Order service health check
  - Endpoint: GET /health
  - Expected: 200 OK với DB connection status
  
- **TC-HEALTH-003**: Payment service health check
  - Expected: Service và Stripe API accessible

- **TC-HEALTH-004**: Notification service health check
  - Expected: Email/SMS providers accessible

- **TC-HEALTH-005**: Food delivery server health check
  - Expected: WebSocket server running

### Database Connectivity
- **TC-HEALTH-006**: MongoDB connection test
  - Expected: All services connect to MongoDB successfully
  
- **TC-HEALTH-007**: Redis connection test (nếu có)
  - Expected: Connection established

### External Services
- **TC-HEALTH-008**: Stripe API connectivity
  - Expected: Payment service có thể gọi Stripe API
  
- **TC-HEALTH-009**: Twilio API connectivity
  - Expected: SMS service hoạt động
  
- **TC-HEALTH-010**: Email service connectivity
  - Expected: Email có thể được gửi

### Metrics Collection
- **TC-METRIC-001**: Prometheus scrape metrics từ services
  - Endpoint: GET /metrics
  - Expected: Metrics được expose ở format Prometheus
  
- **TC-METRIC-002**: Verify metrics accuracy
  - Expected: Counter metrics tăng đúng khi có requests
  
- **TC-METRIC-003**: Verify response time metrics
  - Expected: Histogram metrics track response time

### Logging
- **TC-LOG-001**: Services ghi logs đúng format
  - Expected: Logs có timestamp, level, message
  
- **TC-LOG-002**: Error logs được ghi khi có exception
  - Expected: Error stack trace trong logs
  
- **TC-LOG-003**: Loki collect logs từ containers
  - Expected: Logs hiển thị trong Grafana

### Load Testing (Performance)
- **TC-PERF-001**: Auth service xử lý 100 req/s
  - Expected: Response time < 200ms, no errors
  
- **TC-PERF-002**: Order service xử lý concurrent requests
  - Expected: No race conditions, data consistency
  
- **TC-PERF-003**: Database performance under load
  - Expected: Query time acceptable

---

## Hướng dẫn chạy tests

### Setup Test Environment

```bash
# Cài đặt dependencies cho testing
npm install --save-dev jest supertest @types/jest

# Hoặc cho từng service
cd auth && npm install --save-dev jest supertest
```

### Cấu hình Jest

Tạo file `jest.config.js` trong mỗi service:

```javascript
export default {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/index.js'
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js'
  ],
  moduleFileExtensions: ['js', 'json'],
  transform: {},
  verbose: true
};
```

### Chạy Unit Tests

```bash
# Chạy tất cả unit tests
npm test

# Chạy với coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Chạy specific test file
npm test -- user.test.js
```

### Chạy Integration Tests

```bash
# Cần MongoDB và các services đang chạy
docker-compose up -d

# Chạy integration tests
npm run test:integration
```

### Chạy E2E Tests

```bash
# Khởi động tất cả services
docker-compose up -d

# Chạy E2E tests
npm run test:e2e
```

### CI/CD Integration

Tests sẽ được chạy tự động trong GitHub Actions pipeline khi:
- Push lên branch main/develop
- Tạo Pull Request

Xem file `.github/workflows/ci.yml` để biết chi tiết.

---

## Test Coverage Goals

- **Unit Tests**: Minimum 70% code coverage
- **Integration Tests**: Cover critical user flows
- **E2E Tests**: Cover top 5 user journeys
- **Health Checks**: All services must have /health endpoint

---

## Ghi chú cho Developers

1. **Viết tests trước khi code** (TDD approach khuyến khích)
2. **Mock external dependencies** trong unit tests
3. **Sử dụng test databases** riêng, không dùng production DB
4. **Clean up test data** sau mỗi test
5. **Test cả happy path và error cases**
6. **Maintain test documentation** khi thêm features mới

---

## Tham khảo

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest for API Testing](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Prometheus Metrics Best Practices](https://prometheus.io/docs/practices/naming/)
