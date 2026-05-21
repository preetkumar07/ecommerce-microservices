'use strict';
const logger = require('../config/logger');

const normalise = (err) => {
  if (err.code === '23505') return Object.assign(err, { statusCode: 409, isOperational: true, code: 'DUPLICATE_VALUE', message: 'Duplicate value' });
  if (err.name === 'JsonWebTokenError') return Object.assign(err, { statusCode: 401, isOperational: true, code: 'INVALID_TOKEN', message: 'Invalid token' });
  if (err.name === 'TokenExpiredError') return Object.assign(err, { statusCode: 401, isOperational: true, code: 'TOKEN_EXPIRED', message: 'Token has expired' });
  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const n = normalise(err);
  if (n.isOperational) return res.status(n.statusCode).json({ error: { message: n.message, code: n.code } });
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: { message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' } });
};

module.exports = errorHandler;