# ErikBank Payment Platform

Real multi-language banking stack behind the ErikBank payment UI (orange gradient design).

## Architecture

| Layer | Language | Service | Port | Responsibility |
|-------|----------|---------|------|----------------|
| Portal | **TypeScript** | `services/portal` | 8085 | Web payment UI & config API |
| Payment routing | **Go** | `services/payment-router` | 8082 | Orchestrates payment flow across services |
| Core banking | **Java** | `services/core-banking` | 8081 | Ledger, balances, transaction persistence |
| Enterprise | **C# (.NET)** | `services/enterprise` | 8083 | Compliance validation & audit trail |
| Fraud & analytics | **Python** | `services/fraud-analytics` | 8084 | Fraud scoring & payment analytics |
| Database | **PostgreSQL** | `sql/init.sql` | 5432 | Accounts, transactions, audit events |

## Payment flow

1. **Portal (TypeScript)** — user selects bank and clicks **Pay now**
2. **Go payment-router** receives `POST /api/payments`
3. **Python fraud-analytics** scores the transaction (`POST /api/score`)
4. **C# enterprise** runs compliance checks (`POST /api/compliance/validate`) and writes audit rows
5. **Java core-banking** posts the transaction to **PostgreSQL** and debits the demo payer account
6. Response returns payment reference, routing channel, fraud score, and QR payload

## Quick start (local)

```bash
# PostgreSQL must be running
sudo service postgresql start

chmod +x erikbank/scripts/start-local.sh
./erikbank/scripts/start-local.sh
```

Open:

- Portal: http://localhost:8085
- Legacy site route: http://localhost:3000/payments/erikbank-pmt (requires payment-router on :8082)

## Docker Compose

```bash
cd erikbank
docker compose up --build
```

## API examples

```bash
# List ErikBank partner banks
curl http://localhost:8082/api/banks?method=erikbank

# Execute a payment
curl -X POST http://localhost:8082/api/payments \
  -H 'Content-Type: application/json' \
  -d '{"payeeName":"Sanne de Vries","amountCents":4999,"currency":"EUR","method":"erikbank","bankCode":"ERIKBANK"}'

# Analytics summary (Python + PostgreSQL)
curl http://localhost:8084/api/analytics/summary
```

## Static UI (existing site)

The design lives in `public/payments/erikbank-pmt/` and is copied to `dist/` by Grunt.  
`app.js` calls the Go router at `http://localhost:8082` by default.

Set `window.ERIKBANK_API` before loading `app.js` to override the router URL.
