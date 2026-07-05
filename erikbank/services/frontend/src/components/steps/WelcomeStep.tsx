"use client";

import { DISCLAIMER } from "@/lib/constants";
import { useState } from "react";

interface WelcomeStepProps {
  methodTitle: string;
  onStart: () => void;
}

export function WelcomeStep({ methodTitle, onStart }: WelcomeStepProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="card flowCard">
      <p className="flowEyebrow">Step 1 · Welcome</p>
      <h2 className="flowTitle">{methodTitle}</h2>
      <p className="flowLead">{DISCLAIMER.summary}</p>

      <div className="disclaimerBox">
        <h3>{DISCLAIMER.title}</h3>
        <ul className="legalList">
          {DISCLAIMER.points.slice(0, 4).map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>

      <label className="acceptRow">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          I understand this is a USDT crypto payment, not a euro (EUR) bank transfer.
        </span>
      </label>

      <button className="btn" type="button" disabled={!accepted} onClick={onStart}>
        Start transaction
        <span className="btnArrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="#14140f" strokeWidth="2.4">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </span>
      </button>
    </div>
  );
}
