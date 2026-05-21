-- Migration: 003_create_payments
-- One payment record per order. Stores provider transaction ID for reconciliation.

CREATE TYPE payment_status AS ENUM (
  'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
);

CREATE TABLE IF NOT EXISTS payments (
  id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID           NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status           payment_status NOT NULL DEFAULT 'pending',
  amount           NUMERIC(12,2)  NOT NULL,
  currency         CHAR(3)        NOT NULL DEFAULT 'PKR',
  provider         VARCHAR(50),                    -- e.g. 'stripe', 'jazzcash', 'cod'
  provider_tx_id   VARCHAR(200),                   -- provider's transaction reference
  provider_payload JSONB,                          -- raw webhook/response stored for audit
  paid_at          TIMESTAMPTZ,
  refunded_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id        ON payments (order_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx_id  ON payments (provider_tx_id);
CREATE INDEX IF NOT EXISTS idx_payments_status          ON payments (status);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();