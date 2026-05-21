'use strict';
require('dotenv').config();

module.exports = {
  env:          process.env.NODE_ENV || 'development',
  port:         parseInt(process.env.PORT || '3003', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isTest:       process.env.NODE_ENV === 'test',
  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    name:     process.env.NODE_ENV === 'test' ? (process.env.DB_NAME_TEST || 'ecommerce_orders_test') : (process.env.DB_NAME || 'ecommerce_orders'),
    user:     process.env.DB_USER     || 'app',
    password: process.env.DB_PASSWORD || 'secret',
    poolMin:  parseInt(process.env.DB_POOL_MIN || '2', 10),
    poolMax:  parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  rabbitmq: {
    url:            process.env.RABBITMQ_URL      || 'amqp://localhost',
    exchange:       process.env.RABBITMQ_EXCHANGE || 'ecommerce.events',
    reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY_MS || '5000', 10),
  },
  jwt: { secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod' },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max:      parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};