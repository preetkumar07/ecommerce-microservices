// src/routes/auth.routes.js
const { Router } = require('express');
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = Router();

// src/routes/auth.routes.js (Line 8 ke qareeb)
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('customer', 'admin', 'seller').optional(), // <-- YE LINE ADD KARO
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login',    validate(loginSchema),    AuthController.login);

module.exports = router;