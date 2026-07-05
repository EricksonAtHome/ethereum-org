const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  socket_id VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS captains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firstname VARCHAR(255) NOT NULL,
  lastname VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  socket_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'inactive',
  vehicle_color VARCHAR(50) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  vehicle_capacity INTEGER NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL DEFAULT 105.8542,
  location_lat DOUBLE PRECISION NOT NULL DEFAULT 21.0285,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  captain_id UUID REFERENCES captains(id) ON DELETE SET NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  fare NUMERIC NOT NULL,
  vehicle VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  duration INTEGER,
  distance INTEGER,
  payment_id VARCHAR(255),
  order_id VARCHAR(255),
  signature VARCHAR(255),
  otp VARCHAR(10) NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blacklist_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backend_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER NOT NULL,
  response_time DOUBLE PRECISION NOT NULL,
  content_length VARCHAR(50),
  formatted_timestamp VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frontend_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  path TEXT NOT NULL,
  params JSONB,
  formatted_timestamp VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_captain_id ON rides(captain_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_captains_vehicle_type ON captains(vehicle_type);
`;

async function initDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required (PostgreSQL / Neon connection string)");
  }

  await pool.query(SCHEMA_SQL);
  console.log("Connected to PostgreSQL (Neon)");
}

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query, initDb };
