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
  UsdtStatusResponse,
  WwftPayerData,
} from "@/lib/types";
import { EMPTY_WWFT } from "@/lib/types";
import { CryptoDisclaimerBanner } from "./CryptoDisclaimerBanner";
import { QrCode } from "./QrCode";
import { UsdtCheckoutPanel } from "./UsdtCheckoutPanel";
import { UsdtQrImage } from "./UsdtQrImage";
import { WwftForm } from "./WwftForm";

interface PaymentPortalProps {
  method: PaymentMethod;
  bankCode: string;
  mode: "bank" | "qr";
  payeeName?: string;
  amountUnits?: number;
}

type StatusType = "success" | "error" | "pending";

function isWwftComplete(wwft: WwftPayerData) {
  return Boolean(
    wwft.fullName &&
      wwft.dateOfBirth &&
      wwft.email &&
      wwft.phone &&
      wwft.idDocumentNumber &&
      wwft.addressStreet &&
      wwft.addressCity &&
      wwft.addressPostalCode &&
      wwft.paymentPurpose,
  );
}

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
  const [wwft, setWwft] = useState<WwftPayerData>(EMPTY_WWFT);
  const [showWwft, setShowWwft] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: StatusType } | null>(
    null,
  );
  const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [liveRate, setLiveRate] = useState<number | null>(null);

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

    fetch("/api/usdt/rate")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.rate) setLiveRate(Number(data.rate));
      })
      .catch(() => undefined);
  }, [method]);

  useEffect(() => {
    if (!lastPayment?.paymentRef || lastPayment.status === "completed") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/${lastPayment.paymentRef}/usdt`);
        if (!response.ok) return;
        const result: UsdtStatusResponse = await response.json();
        if (result.status === "completed") {
          setLastPayment((prev) =>
            prev ? { ...prev, status: "completed", usdtOrderStatus: result.usdtOrderStatus } : prev,
          );
          setStatus({
            message: `USDT payment confirmed on ${prevChainLabel(lastPayment)}. Ref ${lastPayment.paymentRef}`,
            type: "success",
          });
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lastPayment]);

  function prevChainLabel(payment: PaymentResponse) {
    return payment.chainLabel || "TRC20";
  }

  async function handlePay() {
    if (!isWwftComplete(wwft)) {
      setShowWwft(true);
      setStatus({
        message: "Complete all WWFT identity fields before paying.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setStatus({
      message: "Creating USDT order via UPay → storing WWFT data in PostgreSQL…",
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
          wwft,
        }),
      });

      const result: PaymentResponse = await response.json();
      if (!response.ok) {
        throw new Error(result.message || result.error || "Payment failed");
      }

      setLastPayment(result);
      setShowWwft(false);
      setStatus({
        message: `${result.message} Ref ${result.paymentRef}`,
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

  const displayAmount = lastPayment
    ? formatCryptoParts(lastPayment.amountCents)
    : amount;

  const usdtAmount = lastPayment?.payUsdt
    ? lastPayment.payUsdt.toFixed(2)
    : `${displayAmount.whole}.${displayAmount.fraction}`;

  return (
    <>
      <CryptoDisclaimerBanner />

      {liveRate != null && (
        <div className="analyticsBar">
          Live USDT/CNY rate: {liveRate.toFixed(4)} · real mainnet gateway · WWFT records stored in
          PostgreSQL
        </div>
      )}

      {analytics && (
        <div className="analyticsBar">
          PostgreSQL ledger · {analytics.totalTransactions} payments · WWFT records stored ·{" "}
          {formatCryptoParts(analytics.volumeCents).whole}.
          {formatCryptoParts(analytics.volumeCents).fraction} {CRYPTO_CURRENCY} volume
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
            {lastPayment?.usdtAddress
              ? `Send USDT on ${lastPayment.chainLabel}`
              : mode === "qr"
                ? "QR USDT amount"
                : `Pay via ${selectedBankName}`}
          </p>
          <div className="amount">
            {displayAmount.whole}
            <span className="amountFraction">.{displayAmount.fraction}</span>
            <span className="amountSymbol"> {CRYPTO_CURRENCY}</span>
          </div>
          <p className="cryptoNote">USDT cryptocurrency only — not euro (EUR)</p>

          {lastPayment?.usdtAddress ? (
            <UsdtCheckoutPanel payment={lastPayment} />
          ) : (
            <>
              {showWwft && <WwftForm value={wwft} onChange={setWwft} disabled={loading} />}
              <button
                className="btn"
                type="button"
                disabled={loading || !selectedBank}
                onClick={handlePay}
              >
                {showWwft ? "Continue to USDT payment" : "Create USDT order"}
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
            </>
          )}
        </div>

        <div className="card methodCard">
          <div className="methodTitle">{labels.title} · UPay USDT gateway</div>

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
                {lastPayment?.usdtAddress ? (
                  <UsdtQrImage
                    className="usdtQrImageInline"
                    value={lastPayment.usdtAddress}
                  />
                ) : (
                  <QrCode />
                )}
              </div>
              <p className="qrText">
                {lastPayment?.usdtAddress ? (
                  <>
                    Send <strong>{usdtAmount} USDT</strong> on {lastPayment.chainLabel} to the
                    address shown above.
                  </>
                ) : (
                  <>
                    Complete WWFT verification, then scan or copy the UPay USDT address for{" "}
                    <strong>
                      {displayAmount.whole}.{displayAmount.fraction} {CRYPTO_CURRENCY}
                    </strong>
                  </>
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
