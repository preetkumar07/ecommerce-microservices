// src/errors/AppError.js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;           // e.g. 'USER_NOT_FOUND', 'INVALID_CREDENTIALS'
    this.isOperational = true;  // distinguishes "expected" errors from bugs
  }
}

module.exports = AppError;