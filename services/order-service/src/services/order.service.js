'use strict';

const db               = require('../config/db');
const OrderRepository  = require('../repositories/order.repository');
const OrderItemRepository = require('../repositories/orderItem.repository');
const MessagingService = require('./messaging.service');
const AppError         = require('../errors/AppError');
const logger           = require('../config/logger');

/**
 * Valid status transitions — an order can only move forward through the lifecycle.
 * Cancellation is only allowed before shipping.
 */
const ALLOWED_TRANSITIONS = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped:    ['delivered'],
  delivered:  [],
  cancelled:  [],
  refunded:   [],
};

const OrderService = {
  /**
   * Place a new order.
   *
   * This is the most critical operation — it must be atomic:
   *   1. Insert the order row
   *   2. Insert all order_item rows
   *   3. Publish order.placed event to RabbitMQ
   *
   * The DB transaction ensures steps 1+2 are atomic.
   * The event is published AFTER the transaction commits — if the publish fails,
   * we log the error but do NOT roll back the order (the event can be retried).
   * This is the "at-least-once" delivery pattern.
   */
  async placeOrder(userId, { items, shippingAddress, notes, userEmail }) {
    if (!items || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400, 'EMPTY_ORDER');
    }

    // Calculate totals from the item list sent by the client.
    // In a real system you'd verify prices against product-service here.
    const subtotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity, 0
    );
    const shippingFee  = subtotal >= 5000 ? 0 : 250;  // free shipping above 5000
    const totalAmount  = subtotal + shippingFee;

    let order;

    // --- Atomic DB transaction: order + items ---
    await db.withTransaction(async (client) => {
      order = await OrderRepository.create(client, {
        userId,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        shippingAddress,
        notes,
      });

      const orderItems = await OrderItemRepository.bulkCreate(
        client,
        order.id,
        items.map((item) => ({
          productId:   item.productId,
          productName: item.productName,
          productSku:  item.productSku || null,
          unitPrice:   item.unitPrice,
          quantity:    item.quantity,
        }))
      );

      order.items = orderItems;
    });
    order.userEmail = userEmail;
    logger.info('Order placed', { orderId: order.id, userId, totalAmount });

    // --- Publish event AFTER commit (best-effort) ---
    try {
      await MessagingService.orderPlaced(order);
    } catch (err) {
      // Do NOT fail the request — the order is saved. Log for manual retry.
      logger.error('Failed to publish order.placed event', {
        orderId: order.id,
        error: err.message,
      });
    }

    return order;
  },

  async getOrderById(orderId, requestingUserId, requestingUserRole) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    // Customers can only see their own orders
    if (requestingUserRole !== 'admin' && order.user_id !== requestingUserId) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND'); // intentionally vague
    }

    return order;
  },

  async getUserOrders(userId, query = {}) {
    return OrderRepository.findByUserId(userId, {
      page:   parseInt(query.page  || '1',  10),
      limit:  Math.min(parseInt(query.limit || '20', 10), 100),
      status: query.status || undefined,
    });
  },

  async getAllOrders(query = {}) {
    return OrderRepository.findAll({
      page:   parseInt(query.page  || '1',  10),
      limit:  Math.min(parseInt(query.limit || '20', 10), 100),
      status: query.status || undefined,
      userId: query.userId || undefined,
    });
  },

  /**
   * Generic status transition — validates the move is legal before applying.
   */
  async updateStatus(orderId, newStatus, meta = {}) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition order from '${order.status}' to '${newStatus}'`,
        422, 'INVALID_STATUS_TRANSITION'
      );
    }

    const updated = await OrderRepository.updateStatus(null, orderId, newStatus, meta);

    // Publish the relevant domain event
    try {
      if (newStatus === 'confirmed')  await MessagingService.orderConfirmed(updated);
      if (newStatus === 'shipped')    await MessagingService.orderShipped(updated, meta.trackingNumber);
      if (newStatus === 'delivered')  await MessagingService.orderDelivered(updated);
    } catch (err) {
      logger.error(`Failed to publish order.${newStatus} event`, { orderId, error: err.message });
    }

    logger.info('Order status updated', { orderId, from: order.status, to: newStatus });
    return updated;
  },

  /**
   * Cancel an order — only allowed before shipping.
   * Publishes order.cancelled so inventory-service can release reserved stock.
   */
  async cancelOrder(orderId, requestingUserId, requestingUserRole, reason) {
    const order = await OrderRepository.findById(orderId);
    if (!order) throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');

    // Customers can only cancel their own orders
    if (requestingUserRole !== 'admin' && order.user_id !== requestingUserId) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes('cancelled')) {
      throw new AppError(
        `Orders with status '${order.status}' cannot be cancelled`,
        422, 'CANNOT_CANCEL'
      );
    }

    const cancelled = await OrderRepository.updateStatus(null, orderId, 'cancelled', {
      cancelledReason: reason,
    });

    try {
      await MessagingService.orderCancelled({ ...cancelled, items: order.items }, reason);
    } catch (err) {
      logger.error('Failed to publish order.cancelled event', { orderId, error: err.message });
    }

    logger.info('Order cancelled', { orderId, reason });
    return cancelled;
  },
};

module.exports = OrderService;