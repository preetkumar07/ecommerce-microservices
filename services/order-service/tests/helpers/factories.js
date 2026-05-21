'use strict';

const { v4: uuidv4 } = require('uuid');
const db = require('../../src/config/db');

const defaultAddress = {
  fullName:   'Test User',
  street:     '1 Main Street',
  city:       'Karachi',
  postalCode: '74200',
  country:    'PK',
};

const defaultItem = () => ({
  productId:   uuidv4(),
  productName: 'Test Product',
  productSku:  'SKU-001',
  unitPrice:   999.00,
  quantity:    2,
});

const createOrder = async (overrides = {}) => {
  const userId   = overrides.userId || uuidv4();
  const items    = overrides.items  || [defaultItem()];
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total    = subtotal + 250;

  let order;
  await db.withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO orders (user_id, subtotal, shipping_fee, total_amount, shipping_address, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [userId, subtotal, 250, total, JSON.stringify(defaultAddress), null]
    );
    order = rows[0];

    const placeholders = items.map((_, i) => `($${i*5+1},$${i*5+2},$${i*5+3},$${i*5+4},$${i*5+5},$${i*5+6})`);
    const vals = items.flatMap((item) => [order.id, item.productId, item.productName, item.productSku, item.unitPrice, item.quantity]);
    const { rows: itemRows } = await client.query(
      `INSERT INTO order_items (order_id,product_id,product_name,product_sku,unit_price,quantity) VALUES ${placeholders.join(',')} RETURNING *`,
      vals
    );
    order.items = itemRows;
  });

  if (overrides.status && overrides.status !== 'pending') {
    const { rows } = await db.query(
      `UPDATE orders SET status = $2 WHERE id = $1 RETURNING *`,
      [order.id, overrides.status]
    );
    order = { ...rows[0], items: order.items };
  }

  return order;
};

module.exports = { createOrder, defaultAddress, defaultItem, uuidv4 };