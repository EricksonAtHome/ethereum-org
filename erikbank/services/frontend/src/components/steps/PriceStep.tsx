"use client";

interface PriceStepProps {
  payeeName: string;
  amountWhole: string;
  amountFraction: string;
  currency: string;
  methodTitle: string;
  bankName: string;
  chainLabel: string;
  onContinue: () => void;
  onBack: () => void;
}

export function PriceStep({
  payeeName,
  amountWhole,
  amountFraction,
  currency,
  methodTitle,
  bankName,
  chainLabel,
  onContinue,
  onBack,
}: PriceStepProps) {
  return (
    <div className="card flowCard">
      <p className="flowEyebrow">Step 2 · Amount</p>
      <h2 className="flowTitle">Review your payment</h2>

      <div className="payee">
        <img className="avatar" src="https://i.pravatar.cc/96?img=12" alt="Payee" />
        <div className="payeeInfo">
          <p>Pay to</p>
          <h3>{payeeName}</h3>
        </div>
      </div>

      <div className="summaryGrid">
        <div className="summaryRow">
          <span>Method</span>
          <strong>{methodTitle}</strong>
        </div>
        <div className="summaryRow">
          <span>Route</span>
          <strong>{bankName}</strong>
        </div>
        <div className="summaryRow">
          <span>Network</span>
          <strong>{chainLabel}</strong>
        </div>
        <div className="summaryRow">
          <span>Currency</span>
          <strong>{currency}</strong>
        </div>
      </div>

      <p className="amountLabel">Total due</p>
      <div className="amount amountHero">
        {amountWhole}
        <span className="amountFraction">.{amountFraction}</span>
        <span className="amountSymbol"> {currency}</span>
      </div>
      <p className="cryptoNote">Cryptocurrency only — not euro (EUR)</p>

      <div className="flowActions">
        <button className="btnSecondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="btn" type="button" onClick={onContinue}>
          Continue to pay
          <span className="btnArrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="#14140f" strokeWidth="2.4">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
