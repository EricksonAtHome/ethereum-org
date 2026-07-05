"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CRYPTO_CURRENCY,
  DEFAULT_AMOUNT_UNITS,
  METHOD_LABELS,
  formatCryptoParts,
} from "@/lib/constants";
import type { PaymentStep } from "@/lib/payment-flow";
import type {
  PaymentMethod,
  PaymentResponse,
  UsdtStatusResponse,
  WwftPayerData,
} from "@/lib/types";
import { EMPTY_WWFT } from "@/lib/types";
import { MobileShell } from "./MobileShell";
import { PayStep } from "./steps/PayStep";
import { PriceStep } from "./steps/PriceStep";
import { ReceiptStep } from "./steps/ReceiptStep";
import { WelcomeStep } from "./steps/WelcomeStep";

interface PaymentPortalProps {
  method: PaymentMethod;
  bankCode: string;
  mode: "bank" | "qr";
  payeeName?: string;
  amountUnits?: number;
}

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

  const [step, setStep] = useState<PaymentStep>("welcome");
  const [selectedBank] = useState(bankCode.toUpperCase());
  const [wwft, setWwft] = useState<WwftPayerData>(EMPTY_WWFT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPayment, setLastPayment] = useState<PaymentResponse | null>(null);
  const [liveRate, setLiveRate] = useState<number | null>(null);

  const bankName =
    mode === "qr" ? `${labels.bankTab} QR` : selectedBank;

  useEffect(() => {
    fetch("/api/usdt/rate")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.rate) setLiveRate(Number(data.rate));
      })
      .catch(() => undefined);
  }, []);

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
          setStep("receipt");
        }
      } catch {
        /* keep polling */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [lastPayment]);

  async function handleConfirmPay() {
    if (!isWwftComplete(wwft)) {
      setError("Complete all identity fields before paying.");
      return;
    }

    setLoading(true);
    setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  function resetFlow() {
    setStep("welcome");
    setLastPayment(null);
    setWwft(EMPTY_WWFT);
    setError(null);
  }

  const amountLabel = `${amount.whole}.${amount.fraction}`;
  const activeChain = wwft.chainType === 2 ? "ERC20" : "TRC20";

  return (
    <MobileShell step={step}>
      {liveRate != null && step !== "receipt" && (
        <div className="analyticsBar">Live USDT rate · {liveRate.toFixed(2)} CNY</div>
      )}

      {step === "welcome" && (
        <WelcomeStep methodTitle={labels.title} onStart={() => setStep("price")} />
      )}

      {step === "price" && (
        <PriceStep
          payeeName={payeeName}
          amountWhole={amount.whole}
          amountFraction={amount.fraction}
          currency={CRYPTO_CURRENCY}
          methodTitle={labels.title}
          bankName={bankName}
          chainLabel={activeChain}
          onBack={() => setStep("welcome")}
          onContinue={() => setStep("pay")}
        />
      )}

      {step === "pay" && (
        <PayStep
          payeeName={payeeName}
          amountLabel={amountLabel}
          wwft={wwft}
          onWwftChange={setWwft}
          loading={loading}
          payment={lastPayment}
          error={error}
          onBack={() => setStep("price")}
          onConfirm={handleConfirmPay}
        />
      )}

      {step === "receipt" && lastPayment && (
        <ReceiptStep
          payment={lastPayment}
          method={method}
          payeeName={payeeName}
          onNewPayment={resetFlow}
        />
      )}
    </MobileShell>
  );
}
