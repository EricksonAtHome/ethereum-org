#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DATABASE_URL="${DATABASE_URL:-jdbc:postgresql://localhost:5432/erikbank}"
export DB_USER="${DB_USER:-erikbank}"
export DB_PASSWORD="${DB_PASSWORD:-erikbank}"
export CORE_BANKING_URL="${CORE_BANKING_URL:-http://localhost:8081}"
export ENTERPRISE_URL="${ENTERPRISE_URL:-http://localhost:8083}"
export FRAUD_URL="${FRAUD_URL:-http://localhost:8084}"
export PAYMENT_ROUTER_URL="${PAYMENT_ROUTER_URL:-http://localhost:8082}"
export FRAUD_ANALYTICS_URL="${FRAUD_ANALYTICS_URL:-http://localhost:8084}"

ensure_db() {
  if command -v psql >/dev/null 2>&1; then
    sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='erikbank'" | grep -q 1 \
      || sudo -u postgres psql -c "CREATE USER erikbank WITH PASSWORD 'erikbank';"
    sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='erikbank'" | grep -q 1 \
      || sudo -u postgres psql -c "CREATE DATABASE erikbank OWNER erikbank;"
    PGPASSWORD=erikbank psql -h localhost -U erikbank -d erikbank -f "$ROOT/sql/init.sql" >/dev/null
  fi
}

ensure_db

echo "Starting core-banking (Java)..."
( cd services/core-banking && mvn -q -DskipTests package && SERVER_PORT=8081 java -jar target/core-banking-1.0.0.jar ) &
PIDS=($!)

echo "Starting enterprise (.NET)..."
( cd services/enterprise/Enterprise && DATABASE_URL="Host=localhost;Port=5432;Database=erikbank;Username=erikbank;Password=erikbank" dotnet run --urls http://0.0.0.0:8083 ) &
PIDS+=($!)

echo "Starting fraud-analytics (Python)..."
( cd services/fraud-analytics && python3 -m venv .venv && . .venv/bin/activate && pip -q install -r requirements.txt && DATABASE_URL=postgresql://erikbank:erikbank@localhost:5432/erikbank PORT=8084 uvicorn main:app --host 0.0.0.0 --port 8084 ) &
PIDS+=($!)

sleep 10

echo "Starting payment-router (Go)..."
( cd services/payment-router && PORT=8082 go run . ) &
PIDS+=($!)

sleep 3

echo "Starting frontend (Next.js)..."
( cd services/frontend && npm install >/dev/null 2>&1 && npm run dev -- --port 8085 ) &
PIDS+=($!)

sleep 4

echo
echo "ErikBank stack running:"
echo "  Next.js frontend:  http://localhost:8085"
echo "  iDEAL page:        http://localhost:8085/ideal"
echo "  Wero page:         http://localhost:8085/wero"
echo "  Payment router:    http://localhost:8082  (Go)"
echo "  Core banking:      http://localhost:8081  (Java)"
echo "  Enterprise:        http://localhost:8083  (C#)"
echo "  Fraud analytics:   http://localhost:8084  (Python)"
echo "  PostgreSQL:        localhost:5432"
echo
echo "Press Ctrl+C to stop."

trap 'kill ${PIDS[@]} 2>/dev/null || true' INT TERM
wait
