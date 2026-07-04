import { DisclaimerPage } from "@/components/DisclaimerPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crypto disclaimer — ErikBank Pmt",
  description: "Cryptocurrency disclaimer. ErikBank Pmt is not euro fiat.",
};

export default function DisclaimerRoute() {
  return <DisclaimerPage />;
}
