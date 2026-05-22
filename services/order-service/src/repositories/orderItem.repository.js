'use strict';

/**
 * All SQL queries for the order_items table.
 * Always called with a transaction client so inserts are atomic with the parent order.
 */
const OrderItemRepository = {
  /**
   * Bulk-insert all line items for a single order.
   * @param {import('pg').PoolClient} client
   * @param {string} orderId
   * @param {Array<{productId, productName, productSku, unitPrice, quantity}>} items
   */
  async bulkCreate(client, orderId, items) {
    if (!items.length) return [];

    // Build a multi-row VALUES clause: ($1,$2,...),($n,$n+1,...), ...
    const placeholders = items.map((_, i) => {
      const base = i * 6;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
    });

    const values = items.flatMap((item) => [
      orderId,
      item.productId,
      item.productName,
      item.productSku || null,
      item.unitPrice,
      item.quantity,
    ]);

    const { rows } = await client.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_sku, unit_price, quantity)
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );
    return rows;
  },

  async findByOrderId(orderId) {
    const { rows } = await require('../config/db').query(
      `SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at`,
      [orderId]
    );
    return rows;
  },
};

module.exports = OrderItemRepository;