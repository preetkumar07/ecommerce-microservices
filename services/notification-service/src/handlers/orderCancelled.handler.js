'use strict';

const EmailService = require('../services/email.service');
const logger       = require('../config/logger');

const orderCancelledHandler = async (payload) => {
  const { orderId, userId, userEmail, reason } = payload;
  logger.info('Handling order.cancelled', { orderId, userId, reason });

  if (!userEmail) {
    logger.warn('order.cancelled event has no userEmail', { orderId });
    return;
  }

  await EmailService.sendOrderCancelled(payload);
};

module.exports = orderCancelledHandler;
