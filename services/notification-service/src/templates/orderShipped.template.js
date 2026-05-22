'use strict';

const base   = require('./base.template');
const config = require('../config/env');

const orderShippedTemplate = ({ orderId, trackingNumber }) => {
  const content = `
    <h2>Your order is on its way! 🚚</h2>
    <p>Your order has been shipped and is heading your way.</p>

    <p>
      <strong>Order ID:</strong>
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">${orderId}</code>
      &nbsp;<span class="badge badge-orange">Shipped</span>
    </p>

    ${trackingNumber ? `
    <div class="address-box" style="text-align:center">
      <p style="margin:0 0 6px;color:#73726c;font-size:13px">Tracking Number</p>
      <p style="margin:0;font-size:20px;font-weight:600;letter-spacing:2px;color:#1a1a2e">${trackingNumber}</p>
    </div>
    ` : '<p>Tracking information will be available soon.</p>'}

    <p>Estimated delivery is within 3–5 business days depending on your location.</p>

    <a href="${config.frontendUrl}/orders/${orderId}" class="btn">Track My Order</a>
  `;

  return base({
    title:     `Order Shipped — #${orderId.slice(0, 8).toUpperCase()}`,
    preheader: `Your order has shipped${trackingNumber ? ` — tracking: ${trackingNumber}` : ''}.`,
    content,
  });
};

module.exports = orderShippedTemplate;
