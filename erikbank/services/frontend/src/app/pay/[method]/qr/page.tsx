import { PaymentPortal } from "@/components/PaymentPortal";
import { BANK_CATALOG, isPaymentMethod } from "@/lib/constants";
import { notFound } from "next/navigation";

export default async function QrPayPage({
  params,
}: {
  params: Promise<{ method: string }>;
}) {
  const { method } = await params;
  if (!isPaymentMethod(method)) notFound();

  const defaultBank = BANK_CATALOG[method][0]?.code;
  if (!defaultBank) notFound();

  return <PaymentPortal method={method} bankCode={defaultBank} mode="qr" />;
}
