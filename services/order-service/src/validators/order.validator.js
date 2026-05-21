'use strict';

const Joi = require('joi');

const addressSchema = Joi.object({
  fullName:   Joi.string().trim().max(200).required(),
  street:     Joi.string().trim().max(200).required(),
  city:       Joi.string().trim().max(100).required(),
  state:      Joi.string().trim().max(100).optional().allow(''),
  postalCode: Joi.string().trim().max(20).required(),
  country:    Joi.string().trim().length(2).uppercase().required(),
  phone:      Joi.string().trim().max(20).optional().allow(''),
});

const orderItemSchema = Joi.object({
  productId:   Joi.string().uuid().required(),
  productName: Joi.string().trim().max(200).required(),
  productSku:  Joi.string().trim().max(100).optional().allow(''),
  unitPrice:   Joi.number().positive().precision(2).required(),
  quantity:    Joi.number().integer().min(1).max(999).required(),
});

const placeOrder = Joi.object({
  items:           Joi.array().items(orderItemSchema).min(1).max(50).required(),
  shippingAddress: addressSchema.required(),
  notes:           Joi.string().trim().max(500).optional().allow(''),
});

const updateStatus = Joi.object({
  status:         Joi.string()
    .valid('confirmed', 'processing', 'shipped', 'delivered', 'refunded')
    .required(),
  trackingNumber: Joi.string().trim().max(100).optional().allow(''),
});

const cancelOrder = Joi.object({
  reason: Joi.string().trim().max(500).optional().allow(''),
});

const listQuery = Joi.object({
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid('pending','confirmed','processing','shipped','delivered','cancelled','refunded')
    .optional(),
  userId: Joi.string().uuid().optional(),
});

module.exports = { placeOrder, updateStatus, cancelOrder, listQuery };