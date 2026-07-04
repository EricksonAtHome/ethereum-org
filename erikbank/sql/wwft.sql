-- WWFT (Dutch AML) payer records and USDT order linkage for ErikBank Pmt

CREATE TABLE IF NOT EXISTS wwft_payer_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_ref VARCHAR(64) NOT NULL UNIQUE,
    merchant_order_sn VARCHAR(128) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(64) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    id_document_type VARCHAR(32) NOT NULL,
    id_document_number VARCHAR(64) NOT NULL,
    address_street VARCHAR(255) NOT NULL,
    address_city VARCHAR(128) NOT NULL,
    address_postal_code VARCHAR(32) NOT NULL,
    address_country VARCHAR(64) NOT NULL,
    payment_purpose TEXT NOT NULL,
    client_ip INET,
    user_agent TEXT,
    chain_type SMALLINT NOT NULL,
    usdt_address VARCHAR(128),
    pay_usdt NUMERIC(18, 8),
    qr_image_url TEXT,
    usdt_order_status SMALLINT NOT NULL DEFAULT 0,
    exchange_rate NUMERIC(18, 8),
    expires_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    raw_gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wwft_merchant_order ON wwft_payer_records(merchant_order_sn);
CREATE INDEX IF NOT EXISTS idx_wwft_email ON wwft_payer_records(email);
CREATE INDEX IF NOT EXISTS idx_wwft_created_at ON wwft_payer_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wwft_usdt_status ON wwft_payer_records(usdt_order_status);
