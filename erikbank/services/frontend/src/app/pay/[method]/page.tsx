import { MethodHub } from "@/components/MethodHub";
import { isPaymentMethod } from "@/lib/constants";
import { notFound } from "next/navigation";

export default async function MethodPage({
  params,
}: {
  params: Promise<{ method: string }>;
}) {
  const { method } = await params;
  if (!isPaymentMethod(method)) notFound();
  return <MethodHub method={method} />;
}
