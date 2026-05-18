'use strict';
const AppError = require('../errors/AppError');

const validate = (schema, target = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[target], { abortEarly: false, stripUnknown: true, convert: true });
  if (error) return next(new AppError(error.details.map((d) => d.message).join('; '), 400, 'VALIDATION_ERROR'));
  req[target] = value;
  next();
};

module.exports = validate;