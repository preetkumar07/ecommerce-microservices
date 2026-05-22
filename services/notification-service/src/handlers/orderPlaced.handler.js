'use strict';

const EmailService = require('../services/email.service');
const logger       = require('../config/logger');

/**
 * Handles the `order.placed` event.
 *
 * Responsibilities:
 *   1. Send order confirmation email to customer
 *
 * In a full system this handler could also:
 *   - Notify warehouse / admin Slack channel
 *   - Trigger SMS via Twilio
 *
 * @param {object} payload — raw event body from RabbitMQ
 */
const orderPlacedHandler = async (payload) => {
  const { orderId, userId, userEmail } = payload;

  logger.info('Handling order.placed', { orderId, userId });

  if (!userEmail) {
    logger.warn('order.placed event has no userEmail — cannot send email', { orderId });
    return; // ack the message; nothing to do without an email
  }

  await EmailService.sendOrderPlaced(payload);
};

module.exports = orderPlacedHandler;
