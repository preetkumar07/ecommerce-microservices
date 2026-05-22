'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('./env');

const logger = createLogger({
  level: config.isProduction ? 'info' : 'debug',
  format: config.isProduction
    ? format.combine(format.timestamp(), format.errors({ stack: true }), format.json())
    : format.combine(format.colorize(), format.timestamp({ format: 'HH:mm:ss' }), format.errors({ stack: true }), format.simple()),
  defaultMeta: { service: 'notification-service' },
  transports: [new transports.Console()],
  silent: config.isTest,
});

module.exports = logger;
