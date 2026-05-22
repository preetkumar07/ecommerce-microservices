'use strict';

/**
 * notification-service has no real API — it is a pure event consumer.
 * This Express app exists only to expose a /health endpoint so Docker
 * and load balancers can confirm the service is alive.
 */

const express    = require('express');
const helmet     = require('helmet');
const { isConnected } = require('./config/rabbitmq');
const config     = require('./config/env');
const logger     = require('./config/logger');

const app = express();

app.use(helmet());
app.use(express.json());

app.get('/health', (req, res) => {
  const mqStatus = isConnected() ? 'connected' : 'disconnected';

  if (!isConnected()) {
    // Still return 200 — the service is up, it'll reconnect on its own
    logger.warn('Health check: RabbitMQ not connected');
  }

  res.json({
    status:    'ok',
    service:   'notification-service',
    rabbitmq:  mqStatus,
    timestamp: new Date().toISOString(),
  });
});

// 404 for any other route
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } });
});

module.exports = app;
