import { NextRequest, NextResponse } from "next/server";
import { listVisits } from "@/lib/visitLog";

// Same trust model as the rest of this app's auth: the caller's claimed
// identity (from their Gold Coin session) is trusted rather than requiring
// the shared password again — this endpoint only ever exposes login
// attempts, not anything sensitive, and only to the one admin name.
export const dynamic = "force-dynamic";

const ADMIN_SURNAME = "жайсанбаев";
const ADMIN_NAME = "максат";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";

  if (normalize(surname) !== ADMIN_SURNAME || normalize(name) !== ADMIN_NAME) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  try {
    const visits = await listVisits();
    return NextResponse.json({ ok: true, visits });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
