// Best-effort client-side fetch of the National Bank of Kazakhstan's official
// USD/KZT rate — published daily, no key or login needed, and equal to
// KASE's weighted-average USDKZT_TOM fixing at 15:30 (the Bank uses that
// exact figure as its official rate). Their feed has no documented schema
// reachable from here, so rather than assume specific XML tag names, this
// looks for "USD" in the raw response and pulls the first plausible KZT/USD
// number out of the text right after it.
export type NbkRateResult =
  | { status: "ok"; rate: number }
  | { status: "error"; message: string };

const NBK_RATES_URL = "https://nationalbank.kz/rss/rates.xml";

// KZT/USD has stayed within roughly this band in recent years; used only to
// reject an obviously wrong regex match (e.g. a percentage change figure),
// not to validate the real-world rate.
const PLAUSIBLE_MIN = 100;
const PLAUSIBLE_MAX = 1000;

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Запрос из браузера не прошёл — вероятно nationalbank.kz не разрешает CORS для стороннего сайта, либо нет сети.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchNbkUsdKztRate(): Promise<NbkRateResult> {
  try {
    const response = await fetch(NBK_RATES_URL);
    if (!response.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${response.status}`);
    }
    const text = await response.text();
    const usdIndex = text.toUpperCase().indexOf("USD");
    if (usdIndex === -1) {
      throw new Error("В ответе Нацбанка не нашли USD.");
    }
    const window = text.slice(usdIndex, usdIndex + 400);
    const candidates = (window.match(/\d{2,4}[.,]\d{1,6}/g) ?? [])
      .map((n) => parseFloat(n.replace(",", ".")))
      .filter((n) => n >= PLAUSIBLE_MIN && n <= PLAUSIBLE_MAX);
    const rate = candidates[0];
    if (rate === undefined) {
      throw new Error("Не удалось найти правдоподобный курс в ответе Нацбанка.");
    }
    return { status: "ok", rate };
  } catch (err) {
    return { status: "error", message: describeFetchError(err) };
  }
}
