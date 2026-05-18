'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  mongo: {
    uri: process.env.NODE_ENV === 'test'
      ? (process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/ecommerce_products_test')
      : (process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_products'),
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    cacheTtl: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-prod',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  },
};

module.exports = config;