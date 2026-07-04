import { PAYMENT_STEPS, stepIndex, type PaymentStep } from "@/lib/payment-flow";

interface PaymentStepBarProps {
  current: PaymentStep;
}

export function PaymentStepBar({ current }: PaymentStepBarProps) {
  const active = stepIndex(current);

  return (
    <div className="stepBar" aria-label="Payment progress">
      {PAYMENT_STEPS.map((step, index) => {
        const done = index < active;
        const isCurrent = index === active;
        return (
          <div
            key={step.id}
            className={`stepItem ${done ? "stepDone" : ""} ${isCurrent ? "stepCurrent" : ""}`}
          >
            <span className="stepDot">{done ? "✓" : index + 1}</span>
            <span className="stepLabel">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
