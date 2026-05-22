'use strict';

const base   = require('./base.template');
const config = require('../config/env');

const orderConfirmedTemplate = ({ orderId }) => {
  const content = `
    <h2>Your order is confirmed ✅</h2>
    <p>Great news! Your order has been confirmed and is now being prepared for dispatch.</p>

    <p>
      <strong>Order ID:</strong>
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">${orderId}</code>
      &nbsp;<span class="badge badge-green">Confirmed</span>
    </p>

    <p>Our team is now picking and packing your items. You will receive a shipping notification with a tracking number once your order is on its way.</p>

    <a href="${config.frontendUrl}/orders/${orderId}" class="btn">Track My Order</a>

    <p style="color:#9c9a92;font-size:13px">
      If you have any questions, please reply to this email or contact our support team.
    </p>
  `;

  return base({
    title:     `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
    preheader: 'Your order has been confirmed and is being prepared.',
    content,
  });
};

module.exports = orderConfirmedTemplate;
