require('dotenv').config();
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || /^(replace|change|super-secret)/i.test(process.env.JWT_SECRET)) {
    throw new Error('Production requires a unique JWT_SECRET of at least 32 characters');
  }
  if (!process.env.FRONTEND_URL?.startsWith('https://')) throw new Error('Production requires HTTPS FRONTEND_URL');
  if (process.env.DEV_MEMORY_MODE === 'true') throw new Error('Memory preview mode is forbidden in production');
}
const express = require('express');
const cors = require('cors');
const http = require('http');
const rateLimit = require('express-rate-limit');

const { connectRedis } = require('./redis');
const { initWebSocket } = require('./ws');
const { startOutboxWorker } = require('./services/settlement');
const { startReconciliationWorker } = require('./services/paymentIntents');

const logger = require('./utils/logger');
const db = require('./db');
const { pubClient } = require('./redis');

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const webhookRoutes = require('./routes/webhooks');
const uploadRoutes = require('./routes/upload');
const publicRoutes = require('./routes/public');

const app = express();
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
const server = http.createServer(app);

// Request tracking & timing middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestPath = req.path;
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${requestPath} - ${res.statusCode} (${duration}ms)`, {
      ip: req.ip,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// CORS configuration - strict for API
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials: true
};
app.use(cors(corsOptions));
// Cookie-authenticated mutations require the exact application origin. The
// frontend and API are served through one origin; no wildcard proxy trust.
app.use((req,res,next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const protectedMutation = require('./services/sessions').sessionCookie(req) || req.path.startsWith('/api/auth/');
    if ((origin && origin !== corsOptions.origin) || (protectedMutation && !origin && process.env.NODE_ENV !== 'test')) {
      return res.status(403).json({ error:'Invalid request origin' });
    }
  }
  next();
});

// Preserve rawBody for accurate cryptographic HMAC webhook signature validation
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use((req,res,next) => {
  if (req.is('application/json') && req.body !== undefined && (!req.body || Array.isArray(req.body) || typeof req.body !== 'object')) {
    return res.status(400).json({ error:'Expected a JSON object' });
  }
  req.body ??= {};
  next();
});

// Global rate limiter - 1000 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(globalLimiter);

// Health Check & Diagnostic Endpoint (Database, Redis, Memory, Uptime)
app.get('/api/health', async (req, res) => {
  const health = {
    status: db.isMemory ? 'preview' : 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check PostgreSQL
    const dbStart = Date.now();
    await db.query('SELECT 1');
    health.services.database = db.isMemory ? 'memory-preview' : `connected (${Date.now() - dbStart}ms)`;
  } catch (err) {
    health.status = 'degraded';
    health.services.database = `disconnected: ${err.message}`;
  }

  try {
    // Check Redis
    const redisStart = Date.now();
    await pubClient.ping();
    health.services.redis = require('./redis').isMemory ? 'memory-preview' : `connected (${Date.now() - redisStart}ms)`;
  } catch (err) {
    health.status = 'degraded';
    health.services.redis = `disconnected: ${err.message}`;
  }

  const statusCode = health.status === 'degraded' ? 503 : 200;
  res.status(statusCode).json(health);
});

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

// Mount Routes
app.use(['/api/auth/nonce','/api/auth/verify'], authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard', uploadRoutes);
app.use('/api/webhooks', webhookLimiter, webhookRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/payments', require('./routes/payments'));

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error:'Malformed JSON body' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error:'Request body too large' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error:'Maximum upload size is 5 MB' });
  if (err.name === 'MulterError') return res.status(400).json({ error:'Invalid multipart upload' });
  // RPC/provider exceptions can embed URLs, credentials and request payloads.
  logger.error('Unhandled server error', null, { path:req.path,method:req.method });
  res.status(500).json({ error: 'Internal Server Error' });
});


// Initialize WebSocket Server
initWebSocket(server);

const PORT = process.env.PORT || 8080;
const stopWorkers = [];

async function startServer() {
  try {
    await db.query('SELECT 1');
    await connectRedis();
  } catch (err) {
    console.error('Startup failed: PostgreSQL and Redis are required. Start Docker services, or use --demo for a non-payment preview.', err.message);
    process.exit(1);
  }

  try {
    if (!db.isMemory) {
      await db.query('SELECT id FROM Payment_Intents LIMIT 0');
      await db.query('SELECT event_id FROM Donation_Outbox LIMIT 0');
      stopWorkers.push(startOutboxWorker(), startReconciliationWorker());
    }
  } catch (err) {
    console.error('Run npm run migrate before starting:', err.message);
    process.exit(1);
  }

  server.listen(PORT, () => {
    logger.info(`⚡ Live Crypto Backend API & WebSockets running on port ${PORT}`);
    console.log(`\n\x1b[32m✔ Live Crypto Backend running on http://localhost:${PORT}\x1b[0m\n`);
  });
}

if (require.main === module) startServer();
if (require.main === module) {
  let closing = false;
  const shutdown = async () => {
    if (closing) return;
    closing = true;
    stopWorkers.forEach(stop => stop());
    const timeout = setTimeout(() => process.exit(1), 15000); timeout.unref();
    server.close(); server.closeIdleConnections();
    await require('./redis').closeRedis();
    await db.close();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}
module.exports = { app, server, startServer };

