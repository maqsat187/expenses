// Kazakhstan public (non-working) holidays — so "next/previous business
// day" skips them the same way weekends already are. Per the Law "О
// праздниках в Республике Казахстан" and Labor Code Art. 85.
//
// Fixed-date holidays recur the same every year; Kurban Ait follows the
// Islamic lunar calendar and shifts, so it has to be added by hand once
// Kazakhstan's muftiate (ДУМК) announces that year's date — same
// maintenance model as the Gold Coin allowlist. If a year below is
// missing a Kurban Ait entry, add it as soon as it's announced.
//
// 2026 dates confirmed via the official production calendar. 2027 dates
// are a mix of confirmed fixed dates and a preliminary (not yet official)
// Kurban Ait date reported in the press — double-check nearer the time.
const KZ_HOLIDAYS_2026 = [
  "2026-01-01", // New Year
  "2026-01-02", // New Year
  "2026-01-07", // Orthodox Christmas
  "2026-03-08", // International Women's Day
  "2026-03-21", // Nauryz
  "2026-03-22", // Nauryz
  "2026-03-23", // Nauryz
  "2026-05-01", // Kazakhstan People's Unity Day
  "2026-05-07", // Defender of the Fatherland Day
  "2026-05-09", // Victory Day
  "2026-05-27", // Kurban Ait (first day)
  "2026-07-06", // Capital Day
  "2026-08-30", // Constitution Day
  "2026-10-25", // Republic Day
  "2026-12-16", // Independence Day
];

const KZ_HOLIDAYS_2027 = [
  "2027-01-01",
  "2027-01-02",
  "2027-01-07",
  "2027-03-08",
  "2027-03-21",
  "2027-03-22",
  "2027-03-23",
  // 2027-05-01 falls on a Saturday — already a weekend, no entry needed.
  "2027-05-07",
  "2027-05-09",
  "2027-05-16", // Kurban Ait (first day) — preliminary, falls on a Sunday anyway
  "2027-07-06",
  "2027-08-30",
  "2027-10-25",
  "2027-12-16",
];

export const KZ_HOLIDAYS = new Set([...KZ_HOLIDAYS_2026, ...KZ_HOLIDAYS_2027]);
