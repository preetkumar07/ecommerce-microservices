'use strict';

const rabbitmq = require('../config/rabbitmq');
const logger   = require('../config/logger');

/**
 * All domain events published by order-service.
 *
 * Routing key convention: <aggregate>.<event>
 * Consumers (notification-service, inventory-service) subscribe via binding keys.
 *
 * Every payload includes:
 *   - eventId    — unique per publish (idempotency key for consumers)
 *   - occurredAt — ISO timestamp
 */

const MessagingService = {
  /**
   * Published when a customer successfully places an order.
   * Consumers: notification-service (confirmation email), inventory-service (reserve stock)
   */
  async orderPlaced(order) {
    const payload = {
      eventId:     require('crypto').randomUUID(),
      occurredAt:  new Date().toISOString(),
      orderId:     order.id,
      userId:      order.user_id,
      totalAmount: order.total_amount,
      items:       order.items,
      shippingAddress: order.shipping_address,
    };

    await rabbitmq.publish('order.placed', payload);
    logger.info('Event published: order.placed', { orderId: order.id });
  },

  /**
   * Published when an order is confirmed (e.g., after payment succeeds).
   * Consumers: notification-service (confirmation email with tracking)
   */
  async orderConfirmed(order) {
    const payload = {
      eventId:    require('crypto').randomUUID(),
      occurredAt: new Date().toISOString(),
      orderId:    order.id,
      userId:     order.user_id,
    };

    await rabbitmq.publish('order.confirmed', payload);
    logger.info('Event published: order.confirmed', { orderId: order.id });
  },

  /**
   * Published when an order is cancelled.
   * Consumers: notification-service (cancellation email), inventory-service (release stock)
   */
  async orderCancelled(order, reason) {
    const payload = {
      eventId:    require('crypto').randomUUID(),
      occurredAt: new Date().toISOString(),
      orderId:    order.id,
      userId:     order.user_id,
      reason:     reason || null,
      items:      order.items,  // so inventory-service knows what to release
    };

    await rabbitmq.publish('order.cancelled', payload);
    logger.info('Event published: order.cancelled', { orderId: order.id });
  },

  /**
   * Published when an order is marked as shipped.
   * Consumers: notification-service (shipping notification with tracking)
   */
  async orderShipped(order, trackingNumber) {
    const payload = {
      eventId:       require('crypto').randomUUID(),
      occurredAt:    new Date().toISOString(),
      orderId:       order.id,
      userId:        order.user_id,
      trackingNumber: trackingNumber || null,
    };

    await rabbitmq.publish('order.shipped', payload);
    logger.info('Event published: order.shipped', { orderId: order.id });
  },

  /**
   * Published when order is delivered.
   */
  async orderDelivered(order) {
    const payload = {
      eventId:    require('crypto').randomUUID(),
      occurredAt: new Date().toISOString(),
      orderId:    order.id,
      userId:     order.user_id,
    };

    await rabbitmq.publish('order.delivered', payload);
    logger.info('Event published: order.delivered', { orderId: order.id });
  },
};

module.exports = MessagingService;