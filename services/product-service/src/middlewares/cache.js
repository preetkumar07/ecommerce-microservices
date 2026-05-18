'use strict';

const redis = require('../config/redis');
const config = require('../config/env');
const logger = require('../config/logger');

/**
 * Route-level cache middleware.
 * Caches the JSON response for GET requests under a key derived from the URL.
 *
 * @param {number} [ttl] — override the default TTL (seconds)
 */
const cache = (ttl = config.redis.cacheTtl) => async (req, res, next) => {
  if (req.method !== 'GET' || config.isTest) return next();

  const key = `cache:product-service:${req.originalUrl}`;
  try {
    const cached = await redis.get(key);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }
  } catch (err) {
    logger.warn('Cache read error', { error: err.message });
  }

  // Monkey-patch res.json to store the response before sending
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      await redis.set(key, body, ttl);
    } catch (err) {
      logger.warn('Cache write error', { error: err.message });
    }
    res.setHeader('X-Cache', 'MISS');
    return originalJson(body);
  };

  next();
};

module.exports = cache;