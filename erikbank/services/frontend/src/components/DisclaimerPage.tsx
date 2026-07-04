import Link from "next/link";
import {
  BANK_CATALOG,
  DISCLAIMER,
  METHOD_LABELS,
} from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";
import { CryptoDisclaimerBanner } from "./CryptoDisclaimerBanner";

export function DisclaimerPage() {
  return (
    <>
      <CryptoDisclaimerBanner />
      <div className="stack">
        <div className="card methodCard">
          <div className="methodTitle">{DISCLAIMER.title}</div>
          <p className="legalText">{DISCLAIMER.summary}</p>
          <ul className="legalList">
            {DISCLAIMER.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <p className="legalText">
            By continuing to any pay page you confirm you understand settlement
            happens in cryptocurrency, not euro fiat currency.
          </p>
          <div className="navLinks">
            <Link className="navBtn" href="/">
              Back to home
            </Link>
          </div>
        </div>

        <div className="card methodCard">
          <div className="methodTitle">Payment method disclaimers</div>
          {(Object.keys(BANK_CATALOG) as PaymentMethod[]).map((method) => (
            <div key={method} className="methodDisclaimerBlock">
              <h3>{METHOD_LABELS[method].title}</h3>
              <p className="legalText">
                {METHOD_LABELS[method].description}. Crypto settlement only —
                not euro.{" "}
                <Link href={`/pay/${method}`}>Open {METHOD_LABELS[method].title}</Link>
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
