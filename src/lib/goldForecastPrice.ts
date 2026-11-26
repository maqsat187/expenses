// Server-only. The same "forecast by current data" figure shown in the
// first box on the Gold Coin page (src/app/gold/page.tsx's forecastPrice:
// goldSpot per gold coin converted through the live KASE rate) -- reused
// by both the scheduled Telegram broadcast
// (src/app/api/alerts/xau-price/route.ts) and the /price command
// (src/app/api/telegram/webhook/route.ts) so the number always matches
// what's on the page.
import { fetchGoldSpot, fetchKaseAverage } from "@/lib/marketSources";
import { formatMoneyPrecise } from "@/lib/format";

export async function buildForecastPriceMessage(): Promise<string> {
  const [goldSpot, kase] = await Promise.all([fetchGoldSpot(), fetchKaseAverage()]);
  const forecastPrice = (goldSpot.price / 20) * kase.averagePrice;
  return `💰 Прогноз цены золота (Gold Coin) по текущим данным: ${formatMoneyPrecise(forecastPrice)}`;
}
