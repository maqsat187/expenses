import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, formatIdentity } from "@/lib/allowlist";
import { setCustomPassword } from "@/lib/goldPasswords";

// Requires the current password to prove it's really that person changing
// their own password, not just their claimed identity — same check the
// login route itself does (custom password if they've set one, otherwise
// the shared default).
export const dynamic = "force-dynamic";

const MIN_LENGTH = 4;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const surname = typeof body?.surname === "string" ? body.surname : "";
  const name = typeof body?.name === "string" ? body.name : "";
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  const match = await checkCredentials(surname, name, currentPassword);
  if (!match) {
    return NextResponse.json(
      { ok: false, message: "Неверный текущий пароль." },
      { status: 401 },
    );
  }
  if (newPassword.length < MIN_LENGTH) {
    return NextResponse.json(
      { ok: false, message: `Новый пароль должен быть не короче ${MIN_LENGTH} символов.` },
      { status: 400 },
    );
  }

  try {
    await setCustomPassword(match.surname, match.name, newPassword);
    return NextResponse.json({ ok: true, displayName: formatIdentity(match) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
