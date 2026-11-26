// Server-only. The same "forecast by current data" figure shown in the
// first box on the Gold Coin page (src/app/gold/page.tsx's forecastPrice
// and diffAmount/diffPercent vs the latest NBK price) -- reused by both
// the scheduled Telegram broadcast (src/app/api/alerts/xau-price/route.ts)
// and the /price command (src/app/api/telegram/webhook/route.ts) so the
// numbers always match what's on the page.
import { fetchGoldSpot, fetchKaseAverage, fetchNbkGold } from "@/lib/marketSources";
import { buildDailyGoldCoinSeries } from "@/lib/goldHistory";
import {
  formatMoneyPrecise,
  formatSignedMoneyPrecise,
  formatSignedPercentPrecise,
  formatDateWithWeekday,
} from "@/lib/format";

export async function buildForecastPriceMessage(): Promise<string> {
  const [goldSpot, kase] = await Promise.all([fetchGoldSpot(), fetchKaseAverage()]);
  const forecastPrice = (goldSpot.price / 20) * kase.averagePrice;

  let diffLine = "";
  try {
    const nbkGold = await fetchNbkGold();
    const series = buildDailyGoldCoinSeries(nbkGold.history);
    const latest = series.length > 0 ? series[series.length - 1] : null;
    if (latest) {
      const diffAmount = forecastPrice - latest.goldCoinPrice;
      const diffPercent = (diffAmount / latest.goldCoinPrice) * 100;
      diffLine = `\n${formatSignedMoneyPrecise(diffAmount)} (${formatSignedPercentPrecise(diffPercent)}) к цене Нацбанка на ${formatDateWithWeekday(latest.date)}`;
    }
  } catch {
    // NBK unavailable -- still send the forecast price alone, same as the
    // page does when its nbkGold fetch fails (it just hides the diff line).
  }

  return `💰 Прогноз цены золота (Gold Coin) по текущим данным: ${formatMoneyPrecise(forecastPrice)}${diffLine}`;
}
