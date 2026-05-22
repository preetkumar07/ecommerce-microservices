'use strict';

const base   = require('./base.template');
const config = require('../config/env');

/**
 * Email sent immediately when a customer places an order.
 * @param {{ orderId, totalAmount, items, shippingAddress }} payload
 */
const orderPlacedTemplate = ({ orderId, totalAmount, items = [], shippingAddress = {} }) => {
  const itemRows = items.map((item) => `
    <tr>
      <td>${item.productName}${item.productSku ? ` <span style="color:#9c9a92;font-size:12px">(${item.productSku})</span>` : ''}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">Rs. ${Number(item.unitPrice).toLocaleString()}</td>
      <td style="text-align:right">Rs. ${(item.unitPrice * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  const content = `
    <h2>We received your order! 🎉</h2>
    <p>Thank you for shopping with us. Your order has been placed and is being processed.</p>

    <p>
      <strong>Order ID:</strong>
      <code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">${orderId}</code>
      &nbsp;<span class="badge badge-blue">Pending</span>
    </p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align:center">Qty</th>
            <th style="text-align:right">Price</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
        <tfoot>
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td style="text-align:right">Rs. ${Number(totalAmount).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <p><strong>Shipping to:</strong></p>
    <div class="address-box">
      ${shippingAddress.fullName || ''}<br/>
      ${shippingAddress.street || ''}<br/>
      ${shippingAddress.city || ''}${shippingAddress.state ? ', ' + shippingAddress.state : ''} ${shippingAddress.postalCode || ''}<br/>
      ${shippingAddress.country || ''}
      ${shippingAddress.phone ? `<br/>${shippingAddress.phone}` : ''}
    </div>

    <a href="${config.frontendUrl}/orders/${orderId}" class="btn">View Order</a>

    <p style="color:#9c9a92;font-size:13px">
      You will receive another email when your order is confirmed and when it ships.
    </p>
  `;

  return base({
    title:     `Order Placed — #${orderId.slice(0, 8).toUpperCase()}`,
    preheader: `Your order of Rs. ${Number(totalAmount).toLocaleString()} has been placed successfully.`,
    content,
  });
};

module.exports = orderPlacedTemplate;
