CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'
);

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL,
  status              order_status NOT NULL DEFAULT 'pending',
  subtotal            NUMERIC(12,2) NOT NULL,
  shipping_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount        NUMERIC(12,2) NOT NULL,
  shipping_address    JSONB       NOT NULL,
  notes               TEXT,
  cancelled_reason    TEXT,
  placed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at        TIMESTAMPTZ,
  shipped_at          TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id   ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status    ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at ON orders (placed_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();