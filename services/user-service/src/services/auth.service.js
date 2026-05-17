// src/services/auth.service.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/user.repository');
const AppError = require('../errors/AppError');

const AuthService = {
  async register({ email, password }) {
    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new AppError('Email already registered', 409, 'EMAIL_IN_USE');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserRepository.create({ email, passwordHash });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user, token };
  },

  async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      // Return same error for missing user and wrong password
      // — prevents user enumeration attacks
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { user: { id: user.id, email: user.email, role: user.role }, token };
  },
};

module.exports = AuthService;