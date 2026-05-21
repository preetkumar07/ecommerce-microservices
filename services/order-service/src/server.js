'use strict';

const app      = require('./app');
const db       = require('./config/db');
const rabbitmq = require('./config/rabbitmq');
const logger   = require('./config/logger');
const config   = require('./config/env');

const start = async () => {
  // ── Connect to PostgreSQL ─────────────────────────────────────────────────
  try {
    await db.ping();
    logger.info('PostgreSQL connected');
  } catch (err) {
    logger.error('PostgreSQL connection failed', { error: err.message });
    process.exit(1);
  }

  // ── Connect to RabbitMQ (non-fatal — orders still work without it) ─────────
  try {
    await rabbitmq.connect();
  } catch (err) {
    logger.warn('RabbitMQ connection failed at startup — events will not be published', {
      error: err.message,
    });
    // Service continues — events will log errors individually when publish is attempted
  }

  // ── Start HTTP server ─────────────────────────────────────────────────────
  const server = app.listen(config.port, () => {
    logger.info(`order-service listening on port ${config.port} [${config.env}]`);
  });

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      try {
        await rabbitmq.close();
        await db.end();
        logger.info('Shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { error: err.message });
        process.exit(1);
      }
    });
    setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
  process.on('uncaughtException',  (e) => {
    logger.error('Uncaught exception', { error: e.message, stack: e.stack });
    process.exit(1);
  });
};

start().catch((err) => {
  console.error('Startup failed:', err);
  process.exit(1);
});