"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BANK_COLORS,
  CRYPTO_CURRENCY,
  DEFAULT_AMOUNT_UNITS,
  METHOD_LABELS,
  bankInitials,
  formatCryptoParts,
  methodHubPath,
  payBankPath,
  payQrPath,
} from "@/lib/constants";
import type {
  AnalyticsSummary,
  BankOption,
  PaymentMethod,
  PaymentResponse,
} from "@/lib/types";
import { CryptoDisclaimerBanner } from "./CryptoDisclaimerBanner";
import { QrCode } from "./QrCode";

interface PaymentPortalProps {
  method: PaymentMethod;
  bankCode: string;
  mode: "bank" | "qr";
  payeeName?: string;
  amountUnits?: number;
}

type StatusType = "success" | "error" | "pending";

export function PaymentPortal({
  method,
  bankCode,
  mode,
  payeeName = "Sanne de Vries",
  amountUnits = DEFAULT_AMOUNT_UNITS,
}: PaymentPortalProps) {
  const labels = METHOD_LABELS[method];
  const amount = useMemo(() => formatCryptoParts(amountUnits), [amountUnits]);

  const [banks, setBanks] = useState<BankOption[]>([]);
  const [selectedBank, setSelectedBank] = useState(bankCode.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: StatusType } | null>(
    null,
  );
  const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const selectedBankName =
    banks.find((bank) => bank.code === selectedBank)?.name || selectedBank;

  useEffect(() => {
    setSelectedBank(bankCode.toUpperCase());
  }, [bankCode]);

  useEffect(() => {
    async function loadBanks() {
      try {
        const response = await fetch(`/api/banks?method=${method}`);
        if (!response.ok) throw new Error("Could not load banks");
        const data = await response.json();
        setBanks(data.banks || []);
      } catch {
        setStatus({
          message: "Backend unavailable. Start ./scripts/start-local.sh",
          type: "error",
        });
      }
    }

    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) setAnalytics(await response.json());
      } catch {
        /* optional */
      }
    }

    loadBanks();
    loadAnalytics();
  }, [method]);

  async function handlePay() {
    setLoading(true);
    setStatus({
      message: "Routing crypto payment via Go → Python → C# → Java → PostgreSQL…",
      type: "pending",
    });

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payeeName,
          amountCents: amountUnits,
          currency: CRYPTO_CURRENCY,
          method,
          bankCode: mode === "qr" ? bankCode.toUpperCase() : selectedBank,
        }),
      });

      const result: PaymentResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "Payment failed");
      }

      setLastPayment(result);
      setStatus({
        message: `${result.message} Ref ${result.paymentRef} · ${result.currency} · fraud ${result.fraudScore}`,
        type: "success",
      });

      const analyticsResponse = await fetch("/api/analytics");
      if (analyticsResponse.ok) setAnalytics(await analyticsResponse.json());
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "Payment failed",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const qrAmount = lastPayment
    ? formatCryptoParts(lastPayment.amountCents)
    : amount;

  return (
    <>
      <CryptoDisclaimerBanner />

      {analytics && (
        <div className="analyticsBar">
          PostgreSQL ledger · {analytics.totalTransactions} crypto payments ·{" "}
          {formatCryptoParts(analytics.volumeCents).whole}.
          {formatCryptoParts(analytics.volumeCents).fraction}{" "}
          {CRYPTO_CURRENCY} volume
        </div>
      )}

      {status && (
        <div
          className={`statusBanner ${
            status.type === "success"
              ? "statusSuccess"
              : status.type === "error"
                ? "statusError"
                : "statusPending"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="stack">
        <div className="card">
          <div className="payee">
            <img
              className="avatar"
              src="https://i.pravatar.cc/96?img=12"
              alt="Payee"
            />
            <div className="payeeInfo">
              <p>Pay to</p>
              <h3>{payeeName}</h3>
            </div>
          </div>

          <p className="amountLabel">
            {mode === "qr" ? "QR crypto amount" : `Pay via ${selectedBankName}`}
          </p>
          <div className="amount">
            {amount.whole}
            <span className="amountFraction">.{amount.fraction}</span>
            <span className="amountSymbol"> {amount.symbol}</span>
          </div>
          <p className="cryptoNote">Cryptocurrency only — not euro (EUR)</p>

          <button
            className="btn"
            type="button"
            disabled={loading || !selectedBank}
            onClick={handlePay}
          >
            Pay crypto now
            <span className="btnArrow">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#14140f"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </span>
          </button>
        </div>

        <div className="card methodCard">
          <div className="methodTitle">{labels.title} checkout</div>

          <div className="tabs">
            <Link
              className={`tab ${mode === "bank" ? "tabActive" : ""}`}
              href={payBankPath(method, selectedBank || bankCode)}
            >
              {labels.bankTab}
            </Link>
            <Link
              className={`tab ${mode === "qr" ? "tabActive" : ""}`}
              href={payQrPath(method)}
            >
              QR code
            </Link>
          </div>

          {mode === "bank" ? (
            <div className="bankList">
              {banks.map((bank) => (
                <Link
                  key={bank.code}
                  className={`bankRow ${
                    selectedBank === bank.code ? "bankRowSelected" : ""
                  }`}
                  href={payBankPath(method, bank.code)}
                >
                  <span
                    className="bankIcon"
                    style={{
                      background: BANK_COLORS[bank.code] || "#14140f",
                    }}
                  >
                    {bankInitials(bank.name)}
                  </span>
                  <span className="bankName">{bank.name}</span>
                  <span className="check" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="qrWrap">
              <div className="qrBox">
                <QrCode />
              </div>
              <p className="qrText">
                Scan with your {labels.qrApp} wallet to pay{" "}
                <strong>
                  {qrAmount.whole}.{qrAmount.fraction} {qrAmount.symbol}
                </strong>{" "}
                to {payeeName}. Crypto only — not EUR.
                {lastPayment?.qrPayload && (
                  <span className="qrPayload">{lastPayment.qrPayload}</span>
                )}
              </p>
            </div>
          )}

          <div className="navLinks">
            <Link className="navBtn" href={methodHubPath(method)}>
              All {labels.title} options
            </Link>
            <Link className="navBtn" href="/disclaimer">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
