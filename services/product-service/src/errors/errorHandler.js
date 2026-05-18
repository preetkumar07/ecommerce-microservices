'use strict';

const logger = require('../config/logger');

const normalise = (err) => {
  if (err.name === 'CastError')           return Object.assign(err, { statusCode: 400,  isOperational: true, code: 'INVALID_ID',       message: `Invalid value for field: ${err.path}` });
  if (err.name === 'ValidationError')     return Object.assign(err, { statusCode: 422,  isOperational: true, code: 'VALIDATION_ERROR',  message: Object.values(err.errors).map((e) => e.message).join('; ') });
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return Object.assign(err, { statusCode: 409, isOperational: true, code: 'DUPLICATE_VALUE', message: `${field} already exists` });
  }
  if (err.name === 'JsonWebTokenError')   return Object.assign(err, { statusCode: 401,  isOperational: true, code: 'INVALID_TOKEN',     message: 'Invalid token' });
  if (err.name === 'TokenExpiredError')   return Object.assign(err, { statusCode: 401,  isOperational: true, code: 'TOKEN_EXPIRED',     message: 'Token has expired' });
  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalised = normalise(err);

  if (normalised.isOperational) {
    return res.status(normalised.statusCode).json({
      error: { message: normalised.message, code: normalised.code },
    });
  }

  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, requestId: req.id });
  res.status(500).json({ error: { message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' } });
};

module.exports = errorHandler;