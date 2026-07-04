"use client";

import { UsdtCheckoutPanel } from "@/components/UsdtCheckoutPanel";
import { WwftForm } from "@/components/WwftForm";
import type { PaymentResponse, WwftPayerData } from "@/lib/types";

interface PayStepProps {
  payeeName: string;
  amountLabel: string;
  wwft: WwftPayerData;
  onWwftChange: (value: WwftPayerData) => void;
  loading: boolean;
  payment: PaymentResponse | null;
  error: string | null;
  onBack: () => void;
  onConfirm: () => void;
}

export function PayStep({
  payeeName,
  amountLabel,
  wwft,
  onWwftChange,
  loading,
  payment,
  error,
  onBack,
  onConfirm,
}: PayStepProps) {
  const chainLabel = wwft.chainType === 2 ? "ERC20" : "TRC20";

  return (
    <div className="card flowCard">
      <p className="flowEyebrow">Step 3 · Pay</p>
      <h2 className="flowTitle">
        {payment?.usdtAddress ? "Send USDT now" : "Identity & payment"}
      </h2>
      <p className="flowLead">
        Pay <strong>{amountLabel} USDT</strong> to {payeeName} on {chainLabel}.
      </p>

      {error && <div className="inlineError">{error}</div>}

      {payment?.usdtAddress ? (
        <UsdtCheckoutPanel payment={payment} />
      ) : (
        <>
          <WwftForm value={wwft} onChange={onWwftChange} disabled={loading} />
          <div className="flowActions">
            <button className="btnSecondary" type="button" onClick={onBack} disabled={loading}>
              Back
            </button>
            <button className="btn" type="button" onClick={onConfirm} disabled={loading}>
              {loading ? "Creating order…" : "Confirm USDT payment"}
              <span className="btnArrow">
                <svg viewBox="0 0 24 24" fill="none" stroke="#14140f" strokeWidth="2.4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </button>
          </div>
        </>
      )}

      {payment?.usdtAddress && (
        <p className="waitingNote">Waiting for blockchain confirmation…</p>
      )}
    </div>
  );
}
