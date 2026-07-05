import { DisclaimerPage } from "@/components/DisclaimerPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto disclaimer — HaitiPay",
  description: "Cryptocurrency disclaimer. HaitiPay is not euro fiat.",
};

export default function DisclaimerRoute() {
  return <DisclaimerPage />;
}
