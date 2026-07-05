import { getFraudUrl } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${getFraudUrl()}/api/analytics/summary`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { totalTransactions: 0, volumeCents: 0, averageFraudScore: 0 },
      { status: 200 },
    );
  }
}
