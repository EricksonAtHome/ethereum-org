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

interface MethodHubProps {
  method: PaymentMethod;
}

export function MethodHub({ method }: MethodHubProps) {
  const labels = METHOD_LABELS[method];
  const banks = BANK_CATALOG[method];

  return (
    <div className="stack">
      <div className="pageHero">
        <h1>{labels.title}</h1>
        <p>Pick a bank or QR route. Each opens the mobile payment wizard.</p>
      </div>

      <div className="card methodCard">
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
                style={{ background: BANK_COLORS[bank.code] || "#14140f" }}
              >
                {bankInitials(bank.name)}
              </span>
              <span className="hubBtnTitle">Pay with {bank.name}</span>
              <span className="hubBtnSub">Welcome → amount → pay → receipt</span>
            </Link>
          ))}
        </div>

        <p className="sectionLabel">Pay by QR</p>
        <Link className="hubBtn" href={payQrPath(method)}>
          <span className="hubBtnTitle">{labels.bankTab} QR code</span>
          <span className="hubBtnSub">Scan-to-pay mobile flow</span>
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
  );
}
