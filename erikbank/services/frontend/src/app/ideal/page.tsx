import { PaymentPortal } from "@/components/PaymentPortal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "iDEAL Pay",
};

export default function IdealPage() {
  return <PaymentPortal method="ideal" />;
}
