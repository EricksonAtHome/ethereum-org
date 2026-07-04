import Link from "next/link";
import {
  BANK_CATALOG,
  BANK_COLORS,
  METHOD_LABELS,
  bankInitials,
  payBankPath,
  payQrPath,
} from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";
import { CryptoDisclaimerBanner } from "./CryptoDisclaimerBanner";

interface MethodHubProps {
  method: PaymentMethod;
}

export function MethodHub({ method }: MethodHubProps) {
  const labels = METHOD_LABELS[method];
  const banks = BANK_CATALOG[method];

  return (
    <>
      <CryptoDisclaimerBanner />
      <div className="stack">
        <div className="card methodCard">
          <div className="methodTitle">{labels.title}</div>
          <p className="legalText">
            Each bank and QR option has its own crypto pay page. Settlement is in
            ETH, not euro.
          </p>

          <p className="sectionLabel">Pay by bank</p>
          <div className="hubGrid">
            {banks.map((bank) => (
              <Link
                key={bank.code}
                className="hubBtn hubBtnBank"
                href={payBankPath(method, bank.code)}
              >
                <span
                  className="hubBankIcon"
                  style={{
                    background: BANK_COLORS[bank.code] || "#14140f",
                  }}
                >
                  {bankInitials(bank.name)}
                </span>
                <span className="hubBtnTitle">Pay with {bank.name}</span>
                <span className="hubBtnSub">Dedicated crypto checkout</span>
              </Link>
            ))}
          </div>

          <p className="sectionLabel">Pay by QR</p>
          <Link className="hubBtn hubBtnQr" href={payQrPath(method)}>
            <span className="hubBtnTitle">{labels.bankTab} QR code pay</span>
            <span className="hubBtnSub">Scan-to-pay crypto page</span>
          </Link>

          <div className="navLinks">
            <Link className="navBtn" href="/">
              Home
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
