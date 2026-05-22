'use strict';

const base   = require('./base.template');
const config = require('../config/env');

const orderCancelledTemplate = ({ orderId, reason }) => {
  const content = `
    <h2>Your order has been cancelled</h2>
    <p>We're sorry to let you know that your order has been cancelled.</p>

    <p>
      <strong>Order ID:</strong>
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">${orderId}</code>
      &nbsp;<span class="badge badge-red">Cancelled</span>
    </p>

    ${reason ? `
    <div class="address-box">
      <strong>Reason:</strong> ${reason}
    </div>
    ` : ''}

    <p>If a payment was made, a refund will be processed to your original payment method within 5–7 business days.</p>

    <a href="${config.frontendUrl}/products" class="btn">Continue Shopping</a>

    <p style="color:#9c9a92;font-size:13px;margin-top:24px">
      If you did not request this cancellation, please contact our support team immediately.
    </p>
  `;

  return base({
    title:     `Order Cancelled — #${orderId.slice(0, 8).toUpperCase()}`,
    preheader: 'Your order has been cancelled. A refund will be processed if applicable.',
    content,
  });
};

module.exports = orderCancelledTemplate;
