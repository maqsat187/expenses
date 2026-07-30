import { NextResponse } from "next/server";
import { collectMarketData } from "@/lib/marketSources";

// Must not be prerendered at build time — the whole point is that it runs
// per request, so the numbers are current when the button is clicked rather
// than frozen at deploy.
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await collectMarketData();

  return NextResponse.json(data, {
    headers: {
      // KASE's anonymous feed is delayed ~15 minutes anyway, so a short
      // shared cache costs no real freshness while sparing the upstream
      // sites a request per click.
      "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
    },
  });
}
