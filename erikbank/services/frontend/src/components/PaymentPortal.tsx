"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BANK_COLORS,
  METHOD_LABELS,
  bankInitials,
  formatAmountParts,
} from "@/lib/constants";
import type {
  AnalyticsSummary,
  BankOption,
  PaymentMethod,
  PaymentResponse,
} from "@/lib/types";
import { QrCode } from "./QrCode";

interface PaymentPortalProps {
  method: PaymentMethod;
  payeeName?: string;
  amountCents?: number;
}

type TabId = "bank" | "qr";
type StatusType = "success" | "error" | "pending";

export function PaymentPortal({
  method,
  payeeName = "Sanne de Vries",
  amountCents = 4999,
}: PaymentPortalProps) {
  const labels = METHOD_LABELS[method];
  const amount = useMemo(() => formatAmountParts(amountCents), [amountCents]);

  const [activeTab, setActiveTab] = useState<TabId>("bank");
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: StatusType } | null>(
    null,
  );
  const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    async function loadBanks() {
      try {
        const response = await fetch(`/api/banks?method=${method}`);
        if (!response.ok) {
          throw new Error("Could not load banks");
        }
        const data = await response.json();
        const list: BankOption[] = data.banks || [];
        setBanks(list);
        if (list.length > 0) {
          setSelectedBank(list[0].code);
        }
      } catch {
        setStatus({
          message:
            "Backend unavailable. Start the ErikBank stack (./erikbank/scripts/start-local.sh).",
          type: "error",
        });
      }
    }

    async function loadAnalytics() {
      try {
        const response = await fetch("/api/analytics");
        if (response.ok) {
          setAnalytics(await response.json());
        }
      } catch {
        /* analytics optional */
      }
    }

    loadBanks();
    loadAnalytics();
  }, [method]);

  async function handlePay() {
    setLoading(true);
    setStatus({
      message: "Routing via Go → Python fraud → C# compliance → Java ledger…",
      type: "pending",
    });

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payeeName,
          amountCents,
          currency: "EUR",
          method,
          bankCode: selectedBank,
        }),
      });

      const result: PaymentResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "Payment failed");
      }

      setLastPayment(result);
      setStatus({
        message: `${result.message} Ref ${result.paymentRef} · fraud ${result.fraudScore} · ${result.routingChannel}`,
        type: "success",
      });

      const analyticsResponse = await fetch("/api/analytics");
      if (analyticsResponse.ok) {
        setAnalytics(await analyticsResponse.json());
      }
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
    ? formatAmountParts(lastPayment.amountCents)
    : amount;

  return (
    <>
      {analytics && (
        <div className="analyticsBar">
          PostgreSQL ledger · {analytics.totalTransactions} payments · €
          {(analytics.volumeCents / 100).toFixed(2)} volume · avg fraud{" "}
          {analytics.averageFraudScore.toFixed(2)}
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

          <p className="amountLabel">Amount to pay</p>
          <div className="amount">
            €{amount.whole}
            <span className="amountFraction">,{amount.fraction}</span>
          </div>

          <button
            className="btn"
            type="button"
            disabled={loading || !selectedBank}
            onClick={handlePay}
          >
            Pay now
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
          <div className="methodTitle">Choose payment method</div>

          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === "bank" ? "tabActive" : ""}`}
              onClick={() => setActiveTab("bank")}
            >
              {labels.bankTab}
            </button>
            <button
              type="button"
              className={`tab ${activeTab === "qr" ? "tabActive" : ""}`}
              onClick={() => setActiveTab("qr")}
            >
              QR code
            </button>
          </div>

          {activeTab === "bank" ? (
            <div className="bankList">
              {banks.map((bank) => (
                <button
                  key={bank.code}
                  type="button"
                  className={`bankRow ${
                    selectedBank === bank.code ? "bankRowSelected" : ""
                  }`}
                  onClick={() => setSelectedBank(bank.code)}
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
                </button>
              ))}
            </div>
          ) : (
            <div className="qrWrap">
              <div className="qrBox">
                <QrCode />
              </div>
              <p className="qrText">
                Scan with your {labels.qrApp} app to pay{" "}
                <strong>
                  €{qrAmount.whole},{qrAmount.fraction}
                </strong>{" "}
                to {payeeName}
                {lastPayment?.qrPayload && (
                  <span className="qrPayload">{lastPayment.qrPayload}</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
