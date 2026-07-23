export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Same precise value as formatCurrency, but with the ₸ symbol appended
// manually instead of resolved through Intl's currency formatter — some
// environments fall back to the 3-letter "KZT" code there instead of the
// symbol, which is both longer and less familiar. Used where every
// character of width counts (compact table cells).
export function formatMoney(amount: number): string {
  const number = new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${number} ₸`;
}

// Short form for tight spaces (chart value labels): "7,5 тыс. ₸" instead of
// "7 480 ₸". Built from the plain compact number rather than
// `style: "currency"` + `notation: "compact"`, which prints odd trailing
// zeros ("850,0") and can't be trusted to resolve the ₸ symbol everywhere.
export function formatCompactCurrency(amount: number): string {
  const compact = new Intl.NumberFormat("ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
  return `${compact} ₸`;
}

export function formatPercent(value: number): string {
  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? parseDateOnly(date) : date;
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

// Compact form for narrow table columns: "20.07.26" instead of
// "20 июл. 2026 г.".
export function formatDateShort(date: Date | string): string {
  const value = typeof date === "string" ? parseDateOnly(date) : date;
  const day = String(value.getDate()).padStart(2, "0");
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const year = String(value.getFullYear()).slice(-2);
  return `${day}.${month}.${year}`;
}

export function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    month: "long",
  }).format(new Date(year, month - 1, 1));
}

// Parses a "YYYY-MM-DD" string as a local date, avoiding the UTC-midnight
// shift that `new Date("YYYY-MM-DD")` applies.
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
