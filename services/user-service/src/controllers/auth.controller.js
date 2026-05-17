// src/controllers/auth.controller.js
const AuthService = require('../services/auth.service');

const AuthController = {
  async register(req, res, next) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.status(201).json({ user, token });
    } catch (err) {
      next(err); // pass to global error handler
    }
  },

  async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.json({ user, token });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;