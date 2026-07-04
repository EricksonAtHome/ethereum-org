export type PaymentStep = "welcome" | "price" | "pay" | "receipt";

export const PAYMENT_STEPS: { id: PaymentStep; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "price", label: "Amount" },
  { id: "pay", label: "Pay" },
  { id: "receipt", label: "Receipt" },
];

export function stepIndex(step: PaymentStep): number {
  return PAYMENT_STEPS.findIndex((item) => item.id === step);
}
