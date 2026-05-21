'use strict';

class AppError extends Error {
  constructor(message, statusCode, code, meta = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;