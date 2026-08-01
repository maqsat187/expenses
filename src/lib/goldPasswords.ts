// Server-only. Lets each Gold Coin user set their own password, replacing
// the shared "Gold2026" default just for them — checked in allowlist.ts's
// checkCredentials, which falls back to the shared password for anyone who
// hasn't set a personal one yet.
//
// Passwords are salted and hashed (scrypt) before storage, never kept in
// the clear — but this table is still only as protected as the rest of
// this app's data: there's no service-role Supabase key here, only the
// public/publishable one, so the same key that lets the server read a
// hash to verify a login would also let a determined visitor query the
// table directly. Hashing keeps that from handing out actual passwords;
// it doesn't make this a hardened auth system, same as everywhere else in
// this app.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";

const KEY_LENGTH = 64;

function hash(password: string, salt: string): string {
  return scryptSync(password, salt, KEY_LENGTH).toString("hex");
}

export async function getCustomPassword(
  surname: string,
  name: string,
): Promise<{ salt: string; hash: string } | null> {
  const { data, error } = await supabase
    .from("gold_user_passwords")
    .select("salt, password_hash")
    .eq("surname", surname)
    .eq("name", name)
    .maybeSingle();
  if (error || !data) return null;
  return { salt: data.salt, hash: data.password_hash };
}

export function verifyCustomPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = Buffer.from(hash(password, salt), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function setCustomPassword(
  surname: string,
  name: string,
  password: string,
): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const { error } = await supabase.from("gold_user_passwords").upsert(
    {
      surname,
      name,
      salt,
      password_hash: hash(password, salt),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "surname,name" },
  );
  if (error) throw new Error(error.message);
}
