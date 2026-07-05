import Link from "next/link";
import { DISCLAIMER, METHOD_LABELS, payBankPath } from "@/lib/constants";

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
        <div className="methodDisclaimerBlock">
          <h3>{METHOD_LABELS.erikbank.title}</h3>
          <p className="legalText">
            {METHOD_LABELS.erikbank.description}.{" "}
            <Link href={payBankPath("erikbank", "ERIKBANK")}>
              Start {METHOD_LABELS.erikbank.title}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
