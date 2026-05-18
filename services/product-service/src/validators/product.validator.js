'use strict';

const Joi = require('joi');

const imageSchema = Joi.object({
  url: Joi.string().uri().required(),
  alt: Joi.string().max(200).optional().allow(''),
});

const create = Joi.object({
  name:         Joi.string().trim().min(2).max(200).required(),
  description:  Joi.string().trim().max(5000).optional().allow(''),
  price:        Joi.number().positive().precision(2).required(),
  comparePrice: Joi.number().positive().precision(2).optional().allow(null),
  sku:          Joi.string().trim().max(100).optional().allow(''),
  category:     Joi.string().hex().length(24).required(),
  images:       Joi.array().items(imageSchema).max(10).optional(),
  attributes:   Joi.object().optional(),
  tags:         Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20).optional(),
  inventory: Joi.object({
    quantity: Joi.number().integer().min(0).default(0),
  }).optional(),
  isActive:     Joi.boolean().optional(),
  isFeatured:   Joi.boolean().optional(),
});

const update = Joi.object({
  name:         Joi.string().trim().min(2).max(200).optional(),
  description:  Joi.string().trim().max(5000).optional().allow(''),
  price:        Joi.number().positive().precision(2).optional(),
  comparePrice: Joi.number().positive().precision(2).optional().allow(null),
  sku:          Joi.string().trim().max(100).optional().allow(''),
  category:     Joi.string().hex().length(24).optional(),
  images:       Joi.array().items(imageSchema).max(10).optional(),
  attributes:   Joi.object().optional(),
  tags:         Joi.array().items(Joi.string().trim().lowercase().max(50)).max(20).optional(),
  isActive:     Joi.boolean().optional(),
  isFeatured:   Joi.boolean().optional(),
}).min(1);

const updateStock = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
});

const listQuery = Joi.object({
  page:       Joi.number().integer().min(1).default(1),
  limit:      Joi.number().integer().min(1).max(100).default(20),
  category:   Joi.string().hex().length(24).optional(),
  minPrice:   Joi.number().min(0).optional(),
  maxPrice:   Joi.number().min(0).optional(),
  tags:       Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
  isFeatured: Joi.boolean().optional(),
  sortBy:     Joi.string().valid('price_asc', 'price_desc', 'newest', 'oldest', 'name_asc').optional(),
});

const searchQuery = Joi.object({
  q:     Joi.string().trim().min(1).max(200).required(),
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { create, update, updateStock, listQuery, searchQuery };