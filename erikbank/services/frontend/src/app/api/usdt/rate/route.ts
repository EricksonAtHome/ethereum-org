import { getRouterUrl } from "@/lib/backend";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${getRouterUrl()}/api/usdt/rate`, {
      cache: "no-store",
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Rate service unavailable" }, { status: 502 });
  }
}
