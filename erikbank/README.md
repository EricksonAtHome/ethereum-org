# ErikBank Payment Platform

Real multi-language banking stack with a **Next.js frontend** and polyglot backend services.

## Architecture

| Layer | Language | Service | Port | Responsibility |
|-------|----------|---------|------|----------------|
| **Frontend** | **Next.js (React/TS)** | `services/frontend` | 8085 | Payment UI, BFF API routes |
| Payment routing | **Go** | `services/payment-router` | 8082 | Orchestrates payment flow |
| Core banking | **Java** | `services/core-banking` | 8081 | Ledger & PostgreSQL transactions |
| Enterprise | **C# (.NET)** | `services/enterprise` | 8083 | Compliance & audit trail |
| Fraud & analytics | **Python** | `services/fraud-analytics` | 8084 | Fraud scoring & analytics |
| Database | **PostgreSQL** | `sql/init.sql` | 5432 | Accounts, transactions, audit |

## Payment flow

1. **Next.js** UI → `POST /api/payments` (Next.js BFF)
2. BFF proxies to **Go** payment-router
3. **Python** fraud-analytics scores the transaction
4. **C#** enterprise validates compliance + audit log
5. **Java** core-banking writes to **PostgreSQL**
6. Response flows back to the Next.js UI with payment ref & QR payload

## Quick start (local)

```bash
sudo service postgresql start
chmod +x erikbank/scripts/start-local.sh
./erikbank/scripts/start-local.sh
```

Open:

- ErikBank: http://localhost:8085
- iDEAL: http://localhost:8085/ideal
- Wero: http://localhost:8085/wero

## Frontend only (dev)

With backends already running:

```bash
cd erikbank/services/frontend
cp env.example .env.local
npm install
npm run dev -- --port 8085
```

## Docker Compose

```bash
cd erikbank
docker compose up --build
```

## API examples

```bash
# Via Next.js BFF
curl http://localhost:8085/api/banks?method=erikbank
curl -X POST http://localhost:8085/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"payeeName":"Sanne de Vries","amountCents":4999,"currency":"EUR","method":"erikbank","bankCode":"ERIKBANK"}'

# Direct Go router
curl http://localhost:8082/api/banks?method=erikbank

# Python analytics (PostgreSQL)
curl http://localhost:8084/api/analytics/summary
```

## Legacy static UI

The original static page remains at `public/payments/erikbank-pmt/` for the ethereum.org site build.
