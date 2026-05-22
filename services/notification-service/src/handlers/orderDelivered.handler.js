'use strict';

const EmailService = require('../services/email.service');
const logger       = require('../config/logger');

const orderDeliveredHandler = async (payload) => {
  const { orderId, userId, userEmail } = payload;
  logger.info('Handling order.delivered', { orderId, userId });

  if (!userEmail) {
    logger.warn('order.delivered event has no userEmail', { orderId });
    return;
  }

  await EmailService.sendOrderDelivered(payload);
};

module.exports = orderDeliveredHandler;
