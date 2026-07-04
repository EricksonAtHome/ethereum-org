import Link from "next/link";
import {
  BANK_CATALOG,
  DISCLAIMER,
  METHOD_LABELS,
  payBankPath,
} from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";

const DEFAULT_BANK: Record<PaymentMethod, string> = {
  erikbank: "ERIKBANK",
  ideal: "ING",
  wero: "BNP",
};

export function DisclaimerPage() {
  return (
    <div className="stack">
      <div className="pageHero">
        <h1>{DISCLAIMER.title}</h1>
        <p>{DISCLAIMER.summary}</p>
      </div>

      <div className="card methodCard">
        <ul className="legalList">
          {DISCLAIMER.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="legalText">
          By starting a transaction you confirm settlement happens in USDT
          cryptocurrency, not euro fiat.
        </p>
        <div className="navLinks">
          <Link className="navBtn" href="/">
            Back to home
          </Link>
        </div>
      </div>

      <div className="card methodCard">
        <div className="methodTitle">Start a payment</div>
        {(Object.keys(BANK_CATALOG) as PaymentMethod[]).map((method) => (
          <div key={method} className="methodDisclaimerBlock">
            <h3>{METHOD_LABELS[method].title}</h3>
            <p className="legalText">
              {METHOD_LABELS[method].description}.{" "}
              <Link href={payBankPath(method, DEFAULT_BANK[method])}>
                Start {METHOD_LABELS[method].title}
              </Link>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
