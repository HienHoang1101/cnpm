# Monitoring Stack - Food Delivery System

Hệ thống monitoring nhẹ sử dụng Prometheus, Grafana, Loki, Promtail và cAdvisor để giám sát các microservices của dự án Food Delivery.

## Các thành phần

- **Prometheus**: Thu thập và lưu trữ metrics từ các services
- **Grafana**: Tạo dashboard và visualization
- **Loki**: Thu thập và lưu trữ logs
- **Promtail**: Agent thu thập logs từ Docker containers
- **cAdvisor**: Giám sát metrics của containers

## Yêu cầu hệ thống

- Docker và Docker Compose đã được cài đặt
- Ít nhất 2GB RAM khả dụng
- Port 3001, 8080, 9090, 3100 chưa bị sử dụng

## Cài đặt và chạy

### 1. Khởi động monitoring stack

```bash
cd monitoring
docker-compose up -d
```

### 2. Kiểm tra trạng thái services

```bash
docker-compose ps
```

### 3. Truy cập các dashboard

- **Grafana**: http://localhost:3001
  - Username: `admin`
  - Password: `admin`
  
- **Prometheus**: http://localhost:9090

- **cAdvisor**: http://localhost:8080

## Cấu hình Grafana

### Thêm Data Sources

1. Đăng nhập vào Grafana (http://localhost:3001)
2. Vào **Configuration > Data Sources**
3. Thêm Prometheus:
   - Chọn "Add data source" > "Prometheus"
   - URL: `http://prometheus:9090`
   - Click "Save & Test"

4. Thêm Loki:
   - Chọn "Add data source" > "Loki"
   - URL: `http://loki:3100`
   - Click "Save & Test"

### Import Dashboards

Grafana cung cấp nhiều dashboard có sẵn. Một số dashboard khuyến nghị:

1. **Docker and System Monitoring**:
   - Dashboard ID: 893 (Docker and System Monitoring)
   - Hoặc tự tạo dashboard theo nhu cầu

2. **Node Exporter Dashboard** (nếu sử dụng):
   - Dashboard ID: 1860

## Cấu hình Services để expose metrics

Các services cần expose endpoint `/metrics` để Prometheus có thể scrape. Thêm thư viện `prom-client` vào các Node.js services:

### Cài đặt prom-client

```bash
npm install prom-client
```

### Thêm metrics endpoint vào service

```javascript
import client from 'prom-client';
import express from 'express';

const app = express();

// Tạo metrics registry
const register = new client.Registry();

// Thu thập default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// ... phần còn lại của service
```

## Targets hiện tại trong Prometheus

Các services được cấu hình để scrape metrics:

- `auth-service`: http://auth:4000/metrics
- `order-service`: http://order:4001/metrics
- `payment-service`: http://payment-service:4002/metrics
- `notification-service`: http://notification-service:4003/metrics
- `food-delivery-server`: http://food-delivery-server:4004/metrics
- `restaurant-service`: http://restaurant:4005/metrics
- `admin-service`: http://admin-service:4006/metrics

**Lưu ý**: Các services cần expose endpoint `/metrics` thì Prometheus mới scrape được. Hiện tại các service chưa có endpoint này.

## Logs Collection

Promtail tự động thu thập logs từ tất cả Docker containers. Không cần cấu hình thêm.

Xem logs trong Grafana:
1. Vào **Explore**
2. Chọn data source **Loki**
3. Chọn container/service từ label selector

## Retention Policy

- **Prometheus**: Lưu trữ metrics trong 7 ngày
- **Loki**: Lưu trữ logs trong 7 ngày (168 giờ)

Thời gian lưu trữ ngắn giúp tiết kiệm tài nguyên, phù hợp cho môi trường development.

## Dừng và xóa monitoring stack

```bash
# Dừng services
docker-compose down

# Dừng và xóa volumes (xóa tất cả data)
docker-compose down -v
```

## Tích hợp với Docker Compose chính

Để tích hợp monitoring với docker-compose chính của project, thêm network `monitoring` vào các services:

```yaml
services:
  auth:
    # ... cấu hình hiện tại
    networks:
      - app-network
      - monitoring

networks:
  app-network:
    driver: bridge
  monitoring:
    external: true
    name: monitoring_monitoring
```

## Bước tiếp theo

1. **Instrument các services**: Thêm prom-client vào từng service để expose /metrics
2. **Tạo custom metrics**: Theo dõi business metrics (số đơn hàng, thời gian xử lý, etc.)
3. **Thiết lập Alertmanager**: Cấu hình cảnh báo qua Slack/Email
4. **Tạo custom dashboards**: Dashboard theo dõi các metrics quan trọng
5. **Log structured logging**: Sử dụng Winston hoặc Pino với JSON format

## Troubleshooting

### Services không hiển thị metrics

- Kiểm tra service đã expose `/metrics` endpoint chưa
- Kiểm tra Prometheus targets tại http://localhost:9090/targets
- Kiểm tra network connectivity giữa Prometheus và services

### Không thấy logs

- Kiểm tra Promtail đang chạy: `docker-compose logs promtail`
- Kiểm tra permissions để access Docker socket
- Kiểm tra Loki status tại http://localhost:3100/ready

### Container memory issues

- Giảm retention period trong cấu hình
- Tăng memory limit cho Docker
- Giới hạn số lượng containers được monitor

## Tài liệu tham khảo

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [prom-client for Node.js](https://github.com/siimon/prom-client)
