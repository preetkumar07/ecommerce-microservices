'use strict';

const app    = require('./app');
const db     = require('./config/db');
const redis  = require('./config/redis');
const logger = require('./config/logger');
const config = require('./config/env');

const start = async () => {
  await db.connect();
  const server = app.listen(config.port, () =>
    logger.info(`product-service listening on port ${config.port} [${config.env}]`)
  );

  const shutdown = async (signal) => {
    logger.info(`${signal} — shutting down`);
    server.close(async () => {
      await db.disconnect();
      await redis.quit();
      logger.info('Shutdown complete');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (r) => logger.error('Unhandled rejection', { reason: String(r) }));
  process.on('uncaughtException',  (e) => { logger.error('Uncaught exception', { error: e.message }); process.exit(1); });
};

start().catch((err) => { console.error('Startup failed', err); process.exit(1); });