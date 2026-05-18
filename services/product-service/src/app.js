'use strict';

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const morgan      = require('morgan');

const routes      = require('./routes');
const errorHandler = require('./errors/errorHandler');
const AppError    = require('./errors/AppError');
const requestId   = require('./middlewares/requestId');
const { defaultLimiter } = require('./middlewares/rateLimiter');
const { ping: dbPing }   = require('./config/db');
const logger      = require('./config/logger');
const config      = require('./config/env');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(requestId);
if (!config.isTest) app.use(morgan('combined', { stream: { write: (m) => logger.http(m.trim()) } }));
app.use(defaultLimiter);

app.get('/health', async (req, res) => {
  try {
    await dbPing();
    res.json({ status: 'ok', service: 'product-service', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', service: 'product-service' });
  }
});

app.use('/api/v1', routes);

app.use((req, res, next) =>
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'))
);

app.use(errorHandler);

module.exports = app;