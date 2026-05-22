'use strict';

const EmailService = require('../services/email.service');
const logger       = require('../config/logger');

const orderShippedHandler = async (payload) => {
  const { orderId, userId, userEmail, trackingNumber } = payload;
  logger.info('Handling order.shipped', { orderId, userId, trackingNumber });

  if (!userEmail) {
    logger.warn('order.shipped event has no userEmail', { orderId });
    return;
  }

  await EmailService.sendOrderShipped(payload);
};

module.exports = orderShippedHandler;
