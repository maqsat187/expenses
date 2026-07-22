// Validated 8-slot categorical palette (dataviz skill). Assign in this
// fixed order — never cycle past index 7; fold the tail into "Другое"
// instead. Written as full literal className strings so Tailwind's scanner
// picks them up.
export const CATEGORICAL_CLASSES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]", // blue
  "bg-[#eb6834] dark:bg-[#d95926]", // orange
  "bg-[#1baf7a] dark:bg-[#199e70]", // aqua
  "bg-[#eda100] dark:bg-[#c98500]", // yellow
  "bg-[#e87ba4] dark:bg-[#d55181]", // magenta
  "bg-[#008300] dark:bg-[#008300]", // green
  "bg-[#4a3aa7] dark:bg-[#9085e9]", // violet
  "bg-[#e34948] dark:bg-[#e66767]", // red
] as const;
