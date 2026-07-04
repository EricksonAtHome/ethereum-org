import Link from "next/link";
import { METHOD_LABELS } from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";
import { CryptoDisclaimerBanner } from "./CryptoDisclaimerBanner";

const METHODS: PaymentMethod[] = ["erikbank", "ideal", "wero"];

export function HomeHub() {
  return (
    <>
      <CryptoDisclaimerBanner />
      <div className="stack">
        <div className="card methodCard">
          <div className="methodTitle">ErikBank Pmt</div>
          <p className="legalText">
            Choose a payment route. Every button opens its own crypto pay page —
            not euro fiat.
          </p>
          <div className="hubGrid">
            {METHODS.map((method) => (
              <Link
                key={method}
                className="hubBtn"
                href={`/pay/${method}`}
              >
                <span className="hubBtnTitle">{METHOD_LABELS[method].title}</span>
                <span className="hubBtnSub">{METHOD_LABELS[method].description}</span>
              </Link>
            ))}
            <Link className="hubBtn hubBtnDisclaimer" href="/disclaimer">
              <span className="hubBtnTitle">Crypto disclaimer</span>
              <span className="hubBtnSub">Not EUR — read before you pay</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
