// Server-only. Imported only by route handlers under src/app/api/auth/ —
// never by a "use client" component — so this list and the shared password
// stay out of the browser bundle, unlike the old PIN system.
//
// To add someone: add a { surname, name } pair below, spelled exactly how
// they'll type it (comparison trims whitespace and ignores case, but the
// words themselves must match).

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
];

export const SHARED_PASSWORD = "Gold2026";

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

// Returns the matched (canonically-spelled) identity, or null if the
// password is wrong or the surname+name pair isn't on the list.
export function checkCredentials(
  surname: string,
  name: string,
  password: string,
): Identity | null {
  if (password !== SHARED_PASSWORD) return null;
  return (
    ALLOWED_USERS.find(
      (u) => normalize(u.surname) === normalize(surname) && normalize(u.name) === normalize(name),
    ) ?? null
  );
}

export function formatIdentity(id: Identity): string {
  return `${id.surname} ${id.name}`;
}
