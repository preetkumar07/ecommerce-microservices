'use strict';

const db = require('../config/db');

const OrderRepository = {
  /**
   * Create an order row inside an existing transaction client.
   */
  async create(client, { userId, subtotal, shippingFee = 0, totalAmount, shippingAddress, notes }) {
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, subtotal, shipping_fee, total_amount, shipping_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, subtotal, shippingFee, totalAmount, JSON.stringify(shippingAddress), notes || null]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await db.query(
      `SELECT o.*,
              json_agg(
                json_build_object(
                  'id',           oi.id,
                  'productId',    oi.product_id,
                  'productName',  oi.product_name,
                  'productSku',   oi.product_sku,
                  'unitPrice',    oi.unit_price,
                  'quantity',     oi.quantity,
                  'subtotal',     oi.subtotal
                ) ORDER BY oi.created_at
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUserId(userId, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    const conditions = ['o.user_id = $1'];
    const values = [userId, limit, offset];

    if (status) {
      conditions.push(`o.status = $${values.length + 1}`);
      values.push(status);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      db.query(
        `SELECT o.id, o.status, o.total_amount, o.placed_at,
                COUNT(oi.id)::int AS item_count
         FROM orders o
         LEFT JOIN order_items oi ON oi.order_id = o.id
         ${where}
         GROUP BY o.id
         ORDER BY o.placed_at DESC
         LIMIT $2 OFFSET $3`,
        values
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM orders o ${where}`,
        [userId, ...(status ? [status] : [])]
      ),
    ]);

    return { orders: rows, total: parseInt(countRows[0].total, 10), page, limit };
  },

  async findAll({ page = 1, limit = 20, status, userId } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [limit, offset];

    if (status) { conditions.push(`o.status = $${values.length + 1}`); values.push(status); }
    if (userId) { conditions.push(`o.user_id = $${values.length + 1}`); values.push(userId); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `SELECT o.id, o.user_id, o.status, o.total_amount, o.placed_at,
              COUNT(oi.id)::int AS item_count
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id
       ORDER BY o.placed_at DESC
       LIMIT $1 OFFSET $2`,
      values
    );
    return rows;
  },

  async updateStatus(client, id, status, extraFields = {}) {
    const timestampMap = {
      confirmed:  'confirmed_at',
      shipped:    'shipped_at',
      delivered:  'delivered_at',
      cancelled:  'cancelled_at',
    };

    const tsField = timestampMap[status];
    const setClauses = ['status = $2'];
    const values = [id, status];

    if (tsField) {
      setClauses.push(`${tsField} = NOW()`);
    }
    if (extraFields.cancelledReason) {
      setClauses.push(`cancelled_reason = $${values.length + 1}`);
      values.push(extraFields.cancelledReason);
    }

    const { rows } = await (client || db).query(
      `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );
    return rows[0] || null;
  },
};

module.exports = OrderRepository;