// src/middlewares/validate.js
const AppError = require('../errors/AppError');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join(', ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }
  req.body = value; // use sanitized/coerced values going forward
  next();
};

module.exports = validate;