// Live browser-side attempt at KASE's USDKZT_TOM weighted average, using
// their own two-step quote-monitor flow (CSRF token, then a POST carrying
// it). The same flow already works server-side in
// scripts/fetch-market-data.mjs — the open question is only whether a
// browser is allowed to make it cross-origin.
//
// For this to succeed from the deployed site, kase.kz has to send
// Access-Control-Allow-Origin for our origin plus
// Access-Control-Allow-Credentials on both requests, and issue its CSRF
// cookie as SameSite=None so the second request can carry it back. Cookies
// guarding CSRF are usually Lax/Strict precisely to stop that, so this may
// well fail — but it had never actually been tested against the real
// endpoint, only mocks, so it's worth finding out. Either way the caller
// falls back to the deploy-time snapshot, so a failure costs one rejected
// request and nothing else.
export type KaseLiveResult =
  | { status: "ok"; averagePrice: number; isRealtime: boolean; serverTime: string | null }
  | { status: "error"; message: string };

function describeFetchError(err: unknown): string {
  if (err instanceof TypeError) {
    return "Браузер заблокировал запрос к kase.kz (CORS) или нет сети.";
  }
  if (err instanceof Error) return err.message;
  return "Неизвестная ошибка";
}

export async function fetchKaseLive(): Promise<KaseLiveResult> {
  try {
    const tokenResponse = await fetch("https://kase.kz/api/accounts/get_token/", {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!tokenResponse.ok) {
      throw new Error(`Не удалось получить токен: HTTP ${tokenResponse.status}`);
    }
    const { csrftoken } = (await tokenResponse.json()) as { csrftoken?: string };
    if (!csrftoken) {
      throw new Error("В ответе KASE нет csrftoken.");
    }

    const watcherResponse = await fetch("https://kase.kz/api/trades/watcher/", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "X-CSRFToken": csrftoken,
      },
      body: new URLSearchParams({
        instruments: "USDKZT_TOM",
        fields: "averageprc,lastdp,tradestatus",
      }).toString(),
    });
    if (!watcherResponse.ok) {
      throw new Error(`Сервер ответил с ошибкой HTTP ${watcherResponse.status}`);
    }

    const data = (await watcherResponse.json()) as {
      is_realtime?: boolean;
      server_time?: string;
      data?: { code?: string; fields?: Record<string, { value?: unknown }> }[];
    };
    const row = data.data?.find((item) => item.code === "USDKZT_TOM");
    if (!row) {
      throw new Error("В ответе KASE нет строки USDKZT_TOM.");
    }
    const raw = row.fields?.averageprc?.value;
    const averagePrice = typeof raw === "number" ? raw : parseFloat(String(raw));
    if (!Number.isFinite(averagePrice)) {
      throw new Error("В ответе KASE нет значения averageprc.");
    }

    return {
      status: "ok",
      averagePrice,
      isRealtime: Boolean(data.is_realtime),
      serverTime: data.server_time ?? null,
    };
  } catch (err) {
    return { status: "error", message: describeFetchError(err) };
  }
}
