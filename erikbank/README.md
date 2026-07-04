# ErikBank Payment Platform

Real multi-language banking stack with a **Next.js frontend**, **UPay USDT Payment Gateway**, and polyglot backend services.

## Production setup (real mainnet USDT)

1. Copy `.env.example` to `.env` and set:
   - `UPAY_TRC20_WALLET` / `UPAY_ERC20_WALLET` — your real receive wallets (optional; auto-generated if empty)
   - `INFURA_API_KEY` — for ERC20 balance checks ([infura.io](https://infura.io))
   - `ETHERSCAN_API_KEY` — for ERC20 tx matching ([etherscan.io](https://etherscan.io/apis))

2. Start the stack:
```bash
docker compose up --build
```

3. On first boot, the gateway:
   - Generates **real mainnet** TRC20/ERC20 wallets if none are configured
   - Saves private keys to the `upay-secrets` Docker volume
   - Creates QR codes from actual wallet addresses
   - Polls TronGrid + Etherscan every **15 seconds** for incoming USDT

4. Check generated wallets in container logs:
```bash
docker compose logs usdt-gateway | grep upay-config
```

## Architecture

| Layer | Language | Service | Port | Responsibility |
|-------|----------|---------|------|----------------|
| **Frontend** | **Next.js (React/TS)** | `services/frontend` | 8085 | ErikBank UI, WWFT form, BFF API routes |
| Payment routing | **Go** | `services/payment-router` | 8082 | Orchestrates flow, WWFT storage, UPay bridge |
| **USDT gateway** | **PHP (UPay)** | `services/usdt-gateway` | 8090 | TRC20/ERC20 USDT collection (full UPay code) |
| UPay worker | **PHP** | `services/usdt-gateway` | — | Cron: order matching & notifications |
| Core banking | **Java** | `services/core-banking` | 8081 | Ledger & PostgreSQL transactions |
| Enterprise | **C# (.NET)** | `services/enterprise` | 8083 | Compliance & audit trail |
| Fraud & analytics | **Python** | `services/fraud-analytics` | 8084 | Fraud scoring & analytics |
| Database | **PostgreSQL** | `sql/init.sql`, `sql/wwft.sql` | 5432 | Accounts, transactions, WWFT payer records |
| UPay database | **MySQL** | `services/usdt-gateway/ddl.sql` | 3306 | UPay orders, merchants, wallet addresses |
| UPay cache | **Redis** | — | 6379 | Address locks & exchange rates |

## Payment flow (USDT + WWFT)

1. User completes **WWFT identity form** (Dutch AML) in the ErikBank UI
2. **Next.js** → `POST /api/payments` with payer data
3. **Go** payment-router stores WWFT record in **PostgreSQL**
4. **Python** fraud-analytics scores the transaction
5. **C#** enterprise validates compliance
6. **Go** calls **UPay** `unifiedorder` API (TRC20/ERC20)
7. **Java** core-banking creates a pending ledger entry (`awaiting_usdt`)
8. User sends USDT to the allocated address; UPay worker confirms on-chain
9. UPay notifies Go → ledger marked `completed`

## Quick start (Docker — recommended)

```bash
cd erikbank
docker compose up --build
```

Open:

- ErikBank: http://localhost:8085
- UPay admin: http://localhost:8090/admin (demo merchant backend)
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

## API examples

```bash
# Via Next.js BFF
curl http://localhost:8085/api/banks?method=erikbank

curl -X POST http://localhost:8085/api/payments \
  -H 'Content-Type: application/json' \
  -d '{
    "payeeName":"Sanne de Vries",
    "amountCents":4999,
    "currency":"USDT",
    "method":"erikbank",
    "bankCode":"ERIKBANK",
    "wwft":{
      "fullName":"Jan de Vries",
      "dateOfBirth":"1990-01-15",
      "nationality":"NL",
      "email":"jan@example.com",
      "phone":"+31612345678",
      "idDocumentType":"passport",
      "idDocumentNumber":"NL1234567",
      "addressStreet":"Keizersgracht 123",
      "addressCity":"Amsterdam",
      "addressPostalCode":"1015 CJ",
      "addressCountry":"NL",
      "paymentPurpose":"Invoice settlement",
      "chainType":1
    }
  }'

# Poll USDT order status
curl http://localhost:8085/api/payments/PMT-xxx/usdt
```

## UPay integration

The full [UPay USDT Payment Gateway](https://github.com/UPay-USDT/USDT-Payment-Gateway) PHP codebase lives in `services/usdt-gateway/`. ErikBank uses its API (`unifiedorder`, `search`) but **not** the default UPay payment pages — checkout uses the ErikBank orange design with WWFT data collection.

## Legacy static UI

The original static page remains at `public/payments/erikbank-pmt/` for the ethereum.org site build.
