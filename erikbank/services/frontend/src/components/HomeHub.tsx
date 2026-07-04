import Link from "next/link";
import { METHOD_LABELS, payBankPath } from "@/lib/constants";
import type { PaymentMethod } from "@/lib/types";

const METHODS: PaymentMethod[] = ["erikbank", "ideal", "wero"];

const DEFAULT_BANK: Record<PaymentMethod, string> = {
  erikbank: "ERIKBANK",
  ideal: "ING",
  wero: "BNP",
};

export function HomeHub() {
  return (
    <div className="stack">
      <div className="pageHero">
        <h1>ErikBank Pmt</h1>
        <p>Mobile USDT payments with step-by-step checkout and WWFT compliance.</p>
      </div>

      <div className="card methodCard">
        <div className="methodTitle">Choose payment route</div>
        <p className="legalText">
          Each option opens a guided flow: welcome → amount → pay → receipt.
        </p>
        <div className="hubGrid">
          {METHODS.map((method) => (
            <Link
              key={method}
              className="hubBtn"
              href={payBankPath(method, DEFAULT_BANK[method])}
            >
              <span className="hubBtnTitle">{METHOD_LABELS[method].title}</span>
              <span className="hubBtnSub">{METHOD_LABELS[method].description}</span>
            </Link>
          ))}
          <Link className="hubBtn hubBtnDisclaimer" href="/disclaimer">
            <span className="hubBtnTitle">Crypto disclaimer</span>
            <span className="hubBtnSub">USDT only — not EUR</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
