// src/app.js
require('dotenv').config();
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const AppError = require('./errors/AppError'); // <-- 1. Brackets hata diye yahan

const app = express();
app.use(express.json());

app.use('/api/v1/auth', authRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
});

// Global error handler
app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
  }

  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    error: { message: 'An unexpected error occurred', code: 'INTERNAL_ERROR' },
  });
});

// <-- 2. ENGINE START KARNE KI COMMAND (Ye add ki hai) -->
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 User Service is running on port ${PORT}`);
});

module.exports = app;