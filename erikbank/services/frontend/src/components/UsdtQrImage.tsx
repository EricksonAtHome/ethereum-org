"use client";

import { useEffect, useState } from "react";

interface UsdtQrImageProps {
  value: string;
  className?: string;
}

export function UsdtQrImage({ value, className }: UsdtQrImageProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let active = true;
    async function buildQr() {
      const QRCode = (await import("qrcode")).default;
      const dataUrl = await QRCode.toDataURL(value, {
        margin: 1,
        width: 180,
        color: { dark: "#14140f", light: "#ffffff" },
      });
      if (active) setQrDataUrl(dataUrl);
    }
    if (value) buildQr();
    return () => {
      active = false;
    };
  }, [value]);

  if (!qrDataUrl) return null;
  return <img className={className} src={qrDataUrl} alt="USDT QR code" />;
}
