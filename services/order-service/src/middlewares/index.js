'use strict';
// middlewares/requestId.js
const { v4: uuidv4 } = require('uuid');
const requestId = (req, res, next) => { req.id = req.headers['x-request-id'] || uuidv4(); res.setHeader('X-Request-Id', req.id); next(); };

// middlewares/validate.js
const AppError = require('../errors/AppError');
const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true, convert: true });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400, 'VALIDATION_ERROR'));
  req[target] = value; next();
};

// middlewares/authenticate.js
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError('No token provided', 401, 'NO_TOKEN'));
  try { req.user = jwt.verify(header.split(' ')[1], config.jwt.secret); next(); }
  catch (err) { next(err); }
};
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError('Forbidden', 403, 'FORBIDDEN'));
  next();
};

// middlewares/rateLimiter.js
const rateLimit = require('express-rate-limit');
const defaultLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs || 900000, max: config.rateLimit?.max || 100,
  standardHeaders: true, legacyHeaders: false,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
  skip: () => config.isTest,
});

module.exports = { requestId, validate, authenticate, requireRole, defaultLimiter };