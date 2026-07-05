import { PaymentPortal } from "@/components/PaymentPortal";
import { BANK_CATALOG, isPaymentMethod } from "@/lib/constants";
import { notFound } from "next/navigation";

export default async function BankPayPage({
  params,
}: {
  params: Promise<{ method: string; bankCode: string }>;
}) {
  const { method, bankCode } = await params;
  if (!isPaymentMethod(method)) notFound();

  const bank = BANK_CATALOG[method].find(
    (item) => item.code.toLowerCase() === bankCode.toLowerCase(),
  );
  if (!bank) notFound();

  return (
    <PaymentPortal method={method} bankCode={bank.code} mode="bank" />
  );
}
