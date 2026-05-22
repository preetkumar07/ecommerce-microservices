'use strict';

const app      = require('./app');
const rabbitmq = require('./config/rabbitmq');
const logger   = require('./config/logger');
const config   = require('./config/env');

const { handleMessage } = require('./consumers/order.consumer');

const start = async () => {
  // ── Start HTTP health-check server ────────────────────────────────────────
  const server = app.listen(config.port, () => {
    logger.info(`notification-service HTTP listening on port ${config.port} [${config.env}]`);
  });

  // ── Connect to RabbitMQ and start consuming ───────────────────────────────
  // This will keep retrying on failure — the service never crashes on broker unavailability
  await rabbitmq.connect(handleMessage);

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await rabbitmq.close();
      logger.info('notification-service shutdown complete');
      process.exit(0);
    });
    setTimeout(() => { logger.error('Forced shutdown after timeout'); process.exit(1); }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
};

start().catch((err) => {
  console.error('Failed to start notification-service:', err);
  process.exit(1);
});
