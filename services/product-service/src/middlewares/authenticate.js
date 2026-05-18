'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('../errors/AppError');
const config = require('../config/env');

const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new AppError('No token provided', 401, 'NO_TOKEN'));
  try {
    const payload = jwt.verify(header.split(' ')[1], config.jwt.secret);
    req.user = { userId: payload.userId, email: payload.email, role: payload.role, jti: payload.jti };
    next();
  } catch (err) {
    next(err); // errorHandler normalises JWT errors
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
  next();
};

module.exports = { authenticate, requireRole };