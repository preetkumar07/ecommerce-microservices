'use strict';

const EmailService = require('../services/email.service');
const logger       = require('../config/logger');

const orderConfirmedHandler = async (payload) => {
  const { orderId, userId, userEmail } = payload;
  logger.info('Handling order.confirmed', { orderId, userId });

  if (!userEmail) {
    logger.warn('order.confirmed event has no userEmail', { orderId });
    return;
  }

  await EmailService.sendOrderConfirmed(payload);
};

module.exports = orderConfirmedHandler;
