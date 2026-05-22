'use strict';

const mailer = require('../config/mailer');
const logger = require('../config/logger');

const orderPlacedTpl    = require('../templates/orderPlaced.template');
const orderConfirmedTpl = require('../templates/orderConfirmed.template');
const orderCancelledTpl = require('../templates/orderCancelled.template');
const orderShippedTpl   = require('../templates/orderShipped.template');
const orderDeliveredTpl = require('../templates/orderDelivered.template');



const guard = async (to, label, fn) => {
  if (!to) {
    logger.warn(`${label}: no recipient email — skipping`);
    return;
  }
  try {
    await fn();
    logger.info(`${label} email sent`, { to });
  } catch (err) {
    logger.error(`${label} email failed`, { to, error: err.message });
    throw err; // re-throw so consumer can nack the message
  }
};

const EmailService = {
  async sendOrderPlaced(payload) {
    await guard(payload.userEmail, 'orderPlaced', () =>
      mailer.sendMail({
        to:      payload.userEmail,
        subject: `Order Received — #${payload.orderId.slice(0, 8).toUpperCase()}`,
        html:    orderPlacedTpl(payload),
      })
    );
  },

  async sendOrderConfirmed(payload) {
    await guard(payload.userEmail, 'orderConfirmed', () =>
      mailer.sendMail({
        to:      payload.userEmail,
        subject: `Order Confirmed — #${payload.orderId.slice(0, 8).toUpperCase()}`,
        html:    orderConfirmedTpl(payload),
      })
    );
  },

  async sendOrderCancelled(payload) {
    await guard(payload.userEmail, 'orderCancelled', () =>
      mailer.sendMail({
        to:      payload.userEmail,
        subject: `Order Cancelled — #${payload.orderId.slice(0, 8).toUpperCase()}`,
        html:    orderCancelledTpl(payload),
      })
    );
  },

  async sendOrderShipped(payload) {
    await guard(payload.userEmail, 'orderShipped', () =>
      mailer.sendMail({
        to:      payload.userEmail,
        subject: `Your Order Has Shipped! — #${payload.orderId.slice(0, 8).toUpperCase()}`,
        html:    orderShippedTpl(payload),
      })
    );
  },

  async sendOrderDelivered(payload) {
    await guard(payload.userEmail, 'orderDelivered', () =>
      mailer.sendMail({
        to:      payload.userEmail,
        subject: `Order Delivered — #${payload.orderId.slice(0, 8).toUpperCase()}`,
        html:    orderDeliveredTpl(payload),
      })
    );
  },
};

module.exports = EmailService;
