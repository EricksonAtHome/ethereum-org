import { getRouterUrl } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ ref: string }> },
) {
  try {
    const { ref } = await context.params;
    const response = await fetch(`${getRouterUrl()}/api/payments/${ref}/usdt`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Payment router unavailable" },
      { status: 502 },
    );
  }
}
