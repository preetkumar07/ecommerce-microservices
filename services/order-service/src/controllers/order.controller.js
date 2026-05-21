'use strict';

const OrderService = require('../services/order.service');

const OrderController = {
  /** POST /api/v1/orders */
  async placeOrder(req, res, next) {
    try {
      const order = await OrderService.placeOrder(req.user.userId, req.body);
      res.status(201).json({ order });
    } catch (err) { next(err); }
  },

  /** GET /api/v1/orders — admin sees all, customer redirected to /my */
  async listAll(req, res, next) {
    try {
      const orders = await OrderService.getAllOrders(req.query);
      res.json({ orders });
    } catch (err) { next(err); }
  },

  /** GET /api/v1/orders/my — authenticated customer's own orders */
  async listMine(req, res, next) {
    try {
      const result = await OrderService.getUserOrders(req.user.userId, req.query);
      res.json(result);
    } catch (err) { next(err); }
  },

  /** GET /api/v1/orders/:id */
  async getOne(req, res, next) {
    try {
      const order = await OrderService.getOrderById(
        req.params.id,
        req.user.userId,
        req.user.role
      );
      res.json({ order });
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/orders/:id/status  (admin only) */
  async updateStatus(req, res, next) {
    try {
      const order = await OrderService.updateStatus(
        req.params.id,
        req.body.status,
        { trackingNumber: req.body.trackingNumber }
      );
      res.json({ order });
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/orders/:id/cancel */
  async cancel(req, res, next) {
    try {
      const order = await OrderService.cancelOrder(
        req.params.id,
        req.user.userId,
        req.user.role,
        req.body.reason
      );
      res.json({ order });
    } catch (err) { next(err); }
  },
};

module.exports = OrderController;