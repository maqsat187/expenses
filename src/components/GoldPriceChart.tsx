"use client";

import { useEffect, useRef } from "react";

// Embeds TradingView's free Advanced Chart widget for XAU/USD — real market
// data (zoom, pan, timeframe switching) with no historical data of our own
// to fetch or store. TradingView's own script renders the chart into the
// container div; nothing else here talks to any API.
//
// Height is passed explicitly into the widget's own config (rather than
// relying on autosize + container CSS) — the widget's injected markup can
// end up controlling its own size regardless of the wrapper div's height,
// so setting it directly here is the reliable way to actually change it.
const CHART_HEIGHT = 1300;

export function GoldPriceChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    container.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.text = JSON.stringify({
      width: "100%",
      height: CHART_HEIGHT,
      symbol: "OANDA:XAUUSD",
      interval: "D",
      timezone: "Asia/Almaty",
      theme: prefersDark ? "dark" : "light",
      style: "2",
      locale: "ru",
      hide_top_toolbar: false,
      allow_symbol_change: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Золото, USD за тройскую унцию (рыночный график)</h2>
      <div
        className="tradingview-widget-container overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
        ref={containerRef}
        style={{ height: CHART_HEIGHT }}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Интерактивный график от TradingView (OANDA:XAUUSD) — масштаб, период и тип графика можно
        менять прямо на нём.
      </p>
    </div>
  );
}
