import { DisclaimerPage } from "@/components/DisclaimerPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto disclaimer — Ayiti Pay",
  description: "Cryptocurrency disclaimer. Ayiti Pay is not euro fiat.",
};

export default function DisclaimerRoute() {
  return <DisclaimerPage />;
}
