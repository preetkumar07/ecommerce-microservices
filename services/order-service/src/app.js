'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const morgan      = require('morgan');

const routes       = require('./routes');
const errorHandler = require('./errors/errorHandler');
const AppError     = require('./errors/AppError');
const { requestId, defaultLimiter } = require('./middlewares');
const { ping: dbPing } = require('./config/db');
const { isConnected: mqConnected } = require('./config/rabbitmq');
const logger  = require('./config/logger');
const config  = require('./config/env');

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
}));
app.use(compression());

// ── Parsing ──────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Observability ────────────────────────────────────────────────────────────
app.use(requestId);
if (!config.isTest) {
  app.use(morgan('combined', { stream: { write: (m) => logger.http(m.trim()) } }));
}

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(defaultLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await dbPing();
    res.json({
      status:    'ok',
      service:   'order-service',
      db:        'connected',
      rabbitmq:  mqConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'order-service' });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'))
);

// ── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;