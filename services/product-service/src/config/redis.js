'use strict';

const Redis = require('ioredis');
const config = require('./env');
const logger = require('./logger');

let client = null;

const getClient = () => {
  if (client) return client;
  client = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
  });
  client.on('connect', () => logger.info('Redis connected'));
  client.on('error',   (err) => logger.warn('Redis error', { error: err.message }));
  return client;
};

const set   = (key, value, ttl) => {
  const s = typeof value === 'string' ? value : JSON.stringify(value);
  return ttl ? getClient().set(key, s, 'EX', ttl) : getClient().set(key, s);
};

const get = async (key) => {
  const raw = await getClient().get(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};

const del    = (key)  => getClient().del(key);
const delPattern = async (pattern) => {
  const keys = await getClient().keys(pattern);
  if (keys.length) await getClient().del(...keys);
};

const quit = async () => { if (client) { await client.quit(); client = null; } };

module.exports = { getClient, set, get, del, delPattern, quit };