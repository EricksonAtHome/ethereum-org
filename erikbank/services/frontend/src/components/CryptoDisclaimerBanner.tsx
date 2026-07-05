import Link from "next/link";
import { DISCLAIMER } from "@/lib/constants";

export function CryptoDisclaimerBanner() {
  return (
    <div className="disclaimerBanner">
      <strong>Crypto only — not EUR.</strong> {DISCLAIMER.summary}{" "}
      <Link href="/disclaimer">Read full disclaimer</Link>
    </div>
  );
}
