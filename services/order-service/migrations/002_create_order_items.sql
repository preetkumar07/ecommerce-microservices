-- Migration: 002_create_order_items
-- Each row is one line-item inside an order.
-- unit_price is SNAPSHOTTED at order time — never joined live from product-service.

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID         NOT NULL,              -- reference only, no FK to product-service
  product_name VARCHAR(200) NOT NULL,              -- snapshot
  product_sku  VARCHAR(100),                       -- snapshot
  unit_price   NUMERIC(12,2) NOT NULL,             -- snapshot at order time
  quantity     INTEGER      NOT NULL CHECK (quantity > 0),
  subtotal     NUMERIC(12,2) GENERATED ALWAYS AS (unit_price * quantity) STORED,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);