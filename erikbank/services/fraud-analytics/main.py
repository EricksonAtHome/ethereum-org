import json
import os
from decimal import Decimal

import psycopg2
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="ErikBank Fraud Analytics", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScoreRequest(BaseModel):
    payee_name: str = Field(alias="payeeName")
    amount_cents: int = Field(alias="amountCents")
    method: str = "erikbank"
    bank_code: str = Field(default="ERIKBANK", alias="bankCode")

    model_config = {"populate_by_name": True}


def db_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql://erikbank:erikbank@localhost:5432/erikbank",
    )


def compute_score(req: ScoreRequest) -> float:
    score = 0.08

    if req.amount_cents >= 500_000:
        score += 0.25
    elif req.amount_cents >= 100_000:
        score += 0.12

    if req.method.lower() == "wero":
        score += 0.05

    if req.bank_code.upper() in {"BBVA", "BUNQ"}:
        score += 0.03

    if "test fraud" in req.payee_name.lower():
        score = 0.95

    return round(min(score, 0.99), 4)


def log_score(req: ScoreRequest, score: float) -> None:
    try:
        with psycopg2.connect(db_url()) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO audit_events (payment_ref, service_name, event_type, payload)
                    VALUES (%s, 'fraud-analytics', 'fraud.score', %s::jsonb)
                    """,
                    (
                        f"score-{req.payee_name[:20]}",
                        json.dumps(
                            {
                                "payeeName": req.payee_name,
                                "amountCents": req.amount_cents,
                                "method": req.method,
                                "bankCode": req.bank_code,
                                "score": score,
                            }
                        ),
                    ),
                )
            conn.commit()
    except Exception:
        pass


@app.get("/api/health")
def health():
    return {"service": "fraud-analytics", "language": "python", "status": "ok"}


@app.post("/api/score")
def score(req: ScoreRequest):
    value = compute_score(req)
    risk = "low" if value < 0.35 else "medium" if value < 0.75 else "high"
    log_score(req, value)
    return {
        "score": value,
        "riskLevel": risk,
        "model": "erikbank-rules-v1",
    }


@app.get("/api/analytics/summary")
def analytics_summary():
    try:
        with psycopg2.connect(db_url()) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        COUNT(*) AS total_transactions,
                        COALESCE(SUM(amount_cents), 0) AS volume_cents,
                        COALESCE(AVG(fraud_score), 0) AS avg_fraud_score
                    FROM transactions
                    WHERE status = 'completed'
                    """
                )
                row = cur.fetchone()
                return {
                    "totalTransactions": row[0],
                    "volumeCents": int(row[1]),
                    "averageFraudScore": float(row[2]) if row[2] else 0.0,
                }
    except Exception as exc:
        return {"error": str(exc), "totalTransactions": 0, "volumeCents": 0}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8084")))
