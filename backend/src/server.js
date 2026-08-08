require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');

const { connectRedis } = require('./redis');
const { initWebSocket } = require('./ws');
const { startPollingService } = require('./services/polling');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');
const publicRoutes = require('./routes/public');

const app = express();
const server = http.createServer(app);

// CORS configuration - strict for API
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// Global rate limiter - 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Stricter rate limiter for auth routes - 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// Stricter rate limiter for webhook routes - 60 requests per minute
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Webhook rate limit exceeded.' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard', uploadRoutes); // Reusing /api/dashboard prefix for upload
app.use('/api/webhooks', webhookLimiter, webhookRoutes);
app.use('/api/public', publicRoutes);

// Initialize WebSocket Server
initWebSocket(server);

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await connectRedis();

    // Start the fallback polling service for missed webhooks
    startPollingService();

    server.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
