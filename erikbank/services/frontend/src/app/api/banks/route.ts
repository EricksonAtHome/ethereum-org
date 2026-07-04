import { getRouterUrl } from "@/lib/backend";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const method = request.nextUrl.searchParams.get("method") || "erikbank";

  try {
    const response = await fetch(
      `${getRouterUrl()}/api/banks?method=${encodeURIComponent(method)}`,
      { cache: "no-store" },
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Payment router unavailable" },
      { status: 502 },
    );
  }
}
