"use client";

import Link from "next/link";
import type { PaymentResponse } from "@/lib/types";
import { methodHubPath } from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";

interface ReceiptStepProps {
  payment: PaymentResponse;
  method: PaymentMethod;
  payeeName: string;
  onNewPayment: () => void;
}

export function ReceiptStep({ payment, method, payeeName, onNewPayment }: ReceiptStepProps) {
  const paidUsdt = payment.payUsdt?.toFixed(2) ?? "0.00";
  const now = new Date().toLocaleString("nl-NL");

  return (
    <div className="card flowCard receiptCard">
      <div className="receiptIcon">✓</div>
      <p className="flowEyebrow">Step 4 · Receipt</p>
      <h2 className="flowTitle">Payment received</h2>
      <p className="flowLead">Your USDT transfer was confirmed on {payment.chainLabel}.</p>

      <div className="receiptBox">
        <div className="summaryRow">
          <span>Reference</span>
          <strong>{payment.paymentRef}</strong>
        </div>
        <div className="summaryRow">
          <span>Order</span>
          <strong>{payment.merchantOrderSn}</strong>
        </div>
        <div className="summaryRow">
          <span>Payee</span>
          <strong>{payeeName}</strong>
        </div>
        <div className="summaryRow">
          <span>Amount</span>
          <strong>{paidUsdt} USDT</strong>
        </div>
        <div className="summaryRow">
          <span>Network</span>
          <strong>{payment.chainLabel}</strong>
        </div>
        <div className="summaryRow">
          <span>Date</span>
          <strong>{now}</strong>
        </div>
        <div className="summaryRow">
          <span>Status</span>
          <strong className="statusPaid">Paid</strong>
        </div>
      </div>

      <div className="flowActions">
        <button className="btnSecondary" type="button" onClick={onNewPayment}>
          New payment
        </button>
        <Link className="btn btnLink" href={methodHubPath(method)}>
          Done
          <span className="btnArrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="#14140f" strokeWidth="2.4">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </Link>
      </div>
    </div>
  );
}
