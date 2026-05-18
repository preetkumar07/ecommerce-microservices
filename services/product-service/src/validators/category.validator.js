'use strict';

const Joi = require('joi');

const create = Joi.object({
  name:        Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).optional(),
  parent:      Joi.string().hex().length(24).optional().allow(null),
});

const update = Joi.object({
  name:        Joi.string().trim().min(2).max(100).optional(),
  description: Joi.string().trim().max(500).optional().allow(''),
  parent:      Joi.string().hex().length(24).optional().allow(null),
  isActive:    Joi.boolean().optional(),
}).min(1);

module.exports = { create, update };