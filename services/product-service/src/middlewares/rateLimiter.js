'use strict';
const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const msg = (code, message) => ({ error: { message, code } });

const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true, legacyHeaders: false,
  message: msg('RATE_LIMIT_EXCEEDED', 'Too many requests, please try again later'),
  skip: () => config.isTest,
});

module.exports = { defaultLimiter };