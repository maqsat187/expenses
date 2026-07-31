// Server-only. The OneDrive Excel workbook link for tracking Gold Coin,
// exposed only to Жайсанбаев Максат via /api/gold/excel-link rather than
// shipped in the client bundle — anyone with this link can open the file,
// so it stays out of the public JS the same way the allowlist and shared
// password already do.
export const GOLD_EXCEL_URL =
  "https://1drv.ms/x/c/70c1be92e3684ad3/IQBGf_rqgjJWSp4beirGRwFpAY9X6MBniCwMUOJ0NA-ue-A?e=Wl7Cj6";
