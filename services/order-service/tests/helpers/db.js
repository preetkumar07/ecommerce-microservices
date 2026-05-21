'use strict';

process.env.NODE_ENV       = 'test';
process.env.DB_NAME_TEST   = 'ecommerce_orders_test';
process.env.JWT_SECRET     = 'test-secret';
process.env.RABBITMQ_URL   = 'amqp://localhost'; // won't actually connect in tests

const db = require('../../src/config/db');

const migrate = async () => {
  await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

  await db.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM (
          'pending','confirmed','processing','shipped','delivered','cancelled','refunded'
        );
      END IF;
    END $$
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id          UUID          NOT NULL,
      status           order_status  NOT NULL DEFAULT 'pending',
      subtotal         NUMERIC(12,2) NOT NULL,
      shipping_fee     NUMERIC(12,2) NOT NULL DEFAULT 0,
      total_amount     NUMERIC(12,2) NOT NULL,
      shipping_address JSONB         NOT NULL,
      notes            TEXT,
      cancelled_reason TEXT,
      placed_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      confirmed_at     TIMESTAMPTZ,
      shipped_at       TIMESTAMPTZ,
      delivered_at     TIMESTAMPTZ,
      cancelled_at     TIMESTAMPTZ,
      created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id   UUID          NOT NULL,
      product_name VARCHAR(200)  NOT NULL,
      product_sku  VARCHAR(100),
      unit_price   NUMERIC(12,2) NOT NULL,
      quantity     INTEGER       NOT NULL CHECK (quantity > 0),
      subtotal     NUMERIC(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
      created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    )
  `);
};

const truncate  = () => db.query('TRUNCATE orders CASCADE');
const teardown  = async () => {
  await db.query('DROP TABLE IF EXISTS order_items CASCADE');
  await db.query('DROP TABLE IF EXISTS orders CASCADE');
  await db.end();
};

module.exports = { migrate, truncate, teardown, db };