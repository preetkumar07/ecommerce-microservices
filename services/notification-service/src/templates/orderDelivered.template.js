'use strict';

const base   = require('./base.template');
const config = require('../config/env');

const orderDeliveredTemplate = ({ orderId }) => {
  const content = `
    <h2>Your order has been delivered! 📦</h2>
    <p>We hope you love your purchase. Your order has been marked as delivered.</p>

    <p>
      <strong>Order ID:</strong>
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">${orderId}</code>
      &nbsp;<span class="badge badge-green">Delivered</span>
    </p>

    <p>Enjoying your order? We'd love to hear your feedback. Leave a review and help other shoppers make informed decisions.</p>

    <a href="${config.frontendUrl}/orders/${orderId}/review" class="btn">Leave a Review</a>

    <p style="color:#9c9a92;font-size:13px;margin-top:24px">
      If there are any issues with your order, please contact our support team within 7 days.
    </p>
  `;

  return base({
    title:     `Order Delivered — #${orderId.slice(0, 8).toUpperCase()}`,
    preheader: 'Your order has been delivered. We hope you love it!',
    content,
  });
};

module.exports = orderDeliveredTemplate;
