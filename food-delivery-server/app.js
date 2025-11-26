const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const client = require('prom-client');
const { createServer } = require('http');
const { setupSocket } = require('./services/socket');
const deliveryRoutes = require('./routes/deliveryRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const { protect } = require('./middleware/auth');
const { checkHealth } = require('./middleware/health');
const authRoutes = require('./routes/authRoutes');
const liveDriverRoutes = require('./routes/liveDrivers');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

// --- MONITORING: Prometheus client setup (CommonJS) ---
client.collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 1, 3, 5]
});

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).send(err.message);
  }
});
// --- end monitoring ---

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

// Database connection
mongoose.connect(process.env.DELIVERY_MONGO_URI)
  .then(() => console.log('MongoDB connected for Delivery Service'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set global service URLs
global.gConfig = {
  auth_url: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',
  order_url: process.env.ORDER_SERVICE_URL || 'http://localhost:5002',
  restaurant_url: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5003',
};
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/earnings', protect, earningsRoutes);
app.use('/api/live-drivers', liveDriverRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'delivery-service'
  });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  });
});

const httpServer = createServer(app);

// Socket.IO Setup
const { io } = setupSocket(httpServer);
app.set('io', io);

// Start server
httpServer.listen(PORT, () => {
  console.log(`Delivery Service running on port ${PORT}`);
});