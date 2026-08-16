// Server-only. Imported only by route handlers under src/app/api/auth/ —
// never by a "use client" component — so this list and the shared password
// stay out of the browser bundle, unlike the old PIN system.
//
// To add someone: add a { surname, name } pair below, spelled exactly how
// they'll type it (comparison trims whitespace and ignores case, but the
// words themselves must match).

import { getCustomPassword, verifyCustomPassword } from "@/lib/goldPasswords";

export type Identity = { surname: string; name: string };

export const ALLOWED_USERS: Identity[] = [
  { surname: "Уксикбаев", name: "Азиз" },
  { surname: "Асанова", name: "Асель" },
  { surname: "Аринбекова", name: "Асель" },
  { surname: "Кусаинова", name: "Асель" },
  { surname: "Сапаргалиев", name: "Эльдар" },
  { surname: "Ермуханов", name: "Малик" },
  { surname: "Дубинин", name: "Олег" },
  { surname: "Жайсанбаев", name: "Максат" },
  { surname: "Утепов", name: "Руслан" },
  { surname: "Бекбашов", name: "Самат" },
  { surname: "Усипбаев", name: "Самат" },
  { surname: "Бижигитова", name: "Умитгуль" },
  { surname: "Жайынбаев", name: "Жантас" },
  { surname: "Бекишева", name: "Сауле" },
  { surname: "Айткулов", name: "Арман" },
  { surname: "Оспан", name: "Максат" },
  { surname: "Гулимбетов", name: "Чингиз" },
];

// Default for anyone who hasn't set their own password yet (see
// goldPasswords.ts / /api/gold/change-password).
export const SHARED_PASSWORD = "Gold2026";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Returns the matched (canonically-spelled) identity, or null if the
// surname+name pair isn't on the list or the password doesn't match —
// their own custom password if they've set one, otherwise the shared
// default.
export async function checkCredentials(
  surname: string,
  name: string,
  password: string,
): Promise<Identity | null> {
  const match = ALLOWED_USERS.find(
    (u) => normalize(u.surname) === normalize(surname) && normalize(u.name) === normalize(name),
  );
  if (!match) return null;

  const custom = await getCustomPassword(match.surname, match.name);
  if (custom) {
    return verifyCustomPassword(password, custom.salt, custom.hash) ? match : null;
  }
  return password === SHARED_PASSWORD ? match : null;
}

export function formatIdentity(id: Identity): string {
  return `${id.surname} ${id.name}`;
}
