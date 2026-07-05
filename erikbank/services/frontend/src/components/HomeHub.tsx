import Link from "next/link";
import { payBankPath } from "@/lib/constants";

export function HomeHub() {
  return (
    <div className="stack">
      <div className="pageHero">
        <h1>HaitiPay</h1>
      </div>

      <div className="card methodCard">
        <div className="methodTitle">Choose payment route</div>
        <p className="legalText">
          Guided flow: welcome → amount → pay → receipt.
        </p>
        <div className="hubGrid">
          <Link className="hubBtn hubBtnPrimary" href={payBankPath("erikbank", "ERIKBANK")}>
            <span className="hubBtnTitle">HaitiPay</span>
          </Link>
          <Link className="hubBtn hubBtnDisclaimer" href="/disclaimer">
            <span className="hubBtnTitle">Crypto disclaimer</span>
            <span className="hubBtnSub">USDT only — not EUR</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
