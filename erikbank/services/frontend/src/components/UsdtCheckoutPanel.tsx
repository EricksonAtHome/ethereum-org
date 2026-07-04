"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaymentResponse } from "@/lib/types";

interface UsdtCheckoutPanelProps {
  payment: PaymentResponse;
}

function explorerUrl(chainType: number | undefined, address: string) {
  if (chainType === 2) {
    return `https://etherscan.io/address/${address}`;
  }
  return `https://tronscan.org/#/address/${address}`;
}

export function UsdtCheckoutPanel({ payment }: UsdtCheckoutPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const payUsdt = payment.payUsdt?.toFixed(2) ?? "0.00";
  const chainLabel = payment.chainLabel || "TRC20";

  useEffect(() => {
    let active = true;
    async function buildQr() {
      const QRCode = (await import("qrcode")).default;
      const payload = payment.usdtAddress || payment.qrPayload;
      if (!payload) return;
      const dataUrl = await QRCode.toDataURL(payload, {
        margin: 1,
        width: 220,
        color: { dark: "#14140f", light: "#ffffff" },
      });
      if (active) setQrDataUrl(dataUrl);
    }
    buildQr();
    return () => {
      active = false;
    };
  }, [payment.qrPayload, payment.usdtAddress]);

  useEffect(() => {
    if (!payment.expiresAt) return;
    const tick = () => {
      const remaining = Math.max(0, payment.expiresAt! - Math.floor(Date.now() / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [payment.expiresAt]);

  const countdownLabel = useMemo(() => {
    if (secondsLeft == null) return null;
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [secondsLeft]);

  async function copyAddress() {
    if (!payment.usdtAddress) return;
    await navigator.clipboard.writeText(payment.usdtAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="usdtCheckout">
      <div className="usdtAmountLine">
        Send exactly <strong>{payUsdt} USDT</strong> on {chainLabel}
      </div>

      {countdownLabel && (
        <p className="usdtCountdown">
          Order expires in <strong>{countdownLabel}</strong>
        </p>
      )}

      <div className="usdtAddressRow">
        <code className="usdtAddress">{payment.usdtAddress}</code>
        <button className="copyBtn" type="button" onClick={copyAddress}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {(qrDataUrl || payment.qrImageUrl) && (
        <img
          className="usdtQrImage"
          src={qrDataUrl || payment.qrImageUrl}
          alt="USDT payment QR code"
        />
      )}

      <div className="usdtLinks">
        {payment.usdtAddress && (
          <a
            className="explorerLink"
            href={explorerUrl(payment.chainType, payment.usdtAddress)}
            target="_blank"
            rel="noreferrer"
          >
            View on {chainLabel === "ERC20" ? "Etherscan" : "Tronscan"}
          </a>
        )}
      </div>

      <p className="usdtHint">
        Real mainnet payment · order {payment.merchantOrderSn} · monitoring blockchain every
        15 seconds
      </p>
    </div>
  );
}
