export const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

const CATEGORY_COLORS: Record<Category, string> = {
  Food: "bg-orange-500",
  Transport: "bg-blue-500",
  Housing: "bg-purple-500",
  Utilities: "bg-cyan-500",
  Entertainment: "bg-pink-500",
  Health: "bg-emerald-500",
  Shopping: "bg-amber-500",
  Other: "bg-slate-500",
};

export function categoryColor(category: string): string {
  return isCategory(category) ? CATEGORY_COLORS[category] : "bg-slate-500";
}
