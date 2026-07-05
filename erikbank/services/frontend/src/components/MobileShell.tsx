import type { ReactNode } from "react";
import { PaymentStepBar } from "./PaymentStepBar";
import type { PaymentStep } from "@/lib/payment-flow";

interface MobileShellProps {
  step?: PaymentStep;
  children: ReactNode;
  footer?: ReactNode;
}

export function MobileShell({ step, children, footer }: MobileShellProps) {
  return (
    <div className="mobileShell">
      {step && <PaymentStepBar current={step} />}
      <div className="mobileContent">{children}</div>
      {footer && <div className="mobileFooter">{footer}</div>}
    </div>
  );
}
