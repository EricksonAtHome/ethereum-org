import { PaymentPortal } from "@/components/PaymentPortal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wero Pay",
};

export default function WeroPage() {
  return <PaymentPortal method="wero" />;
}
