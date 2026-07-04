-- ErikBank transaction database (PostgreSQL)
-- Core banking ledger, payments, and enterprise audit trail

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holder_name VARCHAR(255) NOT NULL,
    iban VARCHAR(34) NOT NULL UNIQUE,
    balance_cents BIGINT NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_ref VARCHAR(64) NOT NULL UNIQUE,
    payer_account_id UUID REFERENCES accounts(id),
    payee_name VARCHAR(255) NOT NULL,
    amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
    currency VARCHAR(8) NOT NULL DEFAULT 'EUR',
    method VARCHAR(32) NOT NULL,
    bank_code VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    fraud_score NUMERIC(5, 4),
    compliance_status VARCHAR(32),
    routing_channel VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_ref ON transactions(payment_ref);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    payment_ref VARCHAR(64) NOT NULL,
    service_name VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_payment_ref ON audit_events(payment_ref);

INSERT INTO accounts (id, holder_name, iban, balance_cents, currency)
VALUES
    ('a1111111-1111-4111-8111-111111111111', 'Demo Payer', 'NL91ERIK0000000001', 250000, 'EUR'),
    ('a2222222-2222-4222-8222-222222222222', 'Sanne de Vries', 'NL44SANN0000000002', 0, 'EUR')
ON CONFLICT (iban) DO NOTHING;
