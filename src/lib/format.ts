export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const value =
    typeof date === "string" ? parseDateOnly(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
}

// Parses a "YYYY-MM-DD" string as a local date, avoiding the UTC-midnight
// shift that `new Date("YYYY-MM-DD")` applies.
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}
