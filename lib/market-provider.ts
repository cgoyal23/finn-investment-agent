import type { MarketSeries, PricePoint } from "./market";

export function parseDailyPrices(result: unknown, now = Date.now()) {
  const r = result as {
    timestamp?: unknown[];
    meta?: {
      exchangeTimezoneName?: string;
      currentTradingPeriod?: { regular?: { start?: number; end?: number } };
    };
    indicators?: {
      quote?: { close?: unknown[]; volume?: unknown[] }[];
      adjclose?: { adjclose?: unknown[] }[];
    };
  } | null;
  if (!r || !Array.isArray(r.timestamp) || !r.indicators?.quote?.[0])
    throw new Error("No prices returned");
  let calendar: Intl.DateTimeFormat;
  try {
    calendar = new Intl.DateTimeFormat("en-CA", {
      timeZone: r.meta?.exchangeTimezoneName || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    throw new Error("The exchange calendar could not be verified");
  }
  const day = (seconds: number) => calendar.format(new Date(seconds * 1000));
  const today = calendar.format(new Date(now));
  const regular = r.meta?.currentTradingPeriod?.regular;
  const regularDate =
    typeof regular?.start === "number" && Number.isFinite(regular.start)
      ? day(regular.start)
      : null;
  const sessionClosed =
    typeof regular?.end === "number" &&
    Number.isFinite(regular.end) &&
    regular.end * 1000 <= now;
  const quote = r.indicators.quote[0];
  const adjusted = r.indicators.adjclose?.[0]?.adjclose || [];
  const points = new Map<string, PricePoint>();
  let excludedOpenSession = false;
  for (let i = 0; i < r.timestamp.length; i++) {
    const timestamp = r.timestamp[i];
    if (
      typeof timestamp !== "number" ||
      !Number.isFinite(timestamp) ||
      timestamp * 1000 > now
    )
      continue;
    const date = day(timestamp);
    // A daily Yahoo response may include the current intraday quote. Never
    // label it EOD until the exchange's regular session has ended.
    if (
      (date === regularDate && !sessionClosed) ||
      (date === today && (date !== regularDate || !sessionClosed))
    ) {
      excludedOpenSession = true;
      continue;
    }
    const close = quote.close?.[i],
      volume = quote.volume?.[i],
      adj = adjusted[i];
    if (
      typeof close !== "number" ||
      !Number.isFinite(close) ||
      close <= 0 ||
      typeof volume !== "number" ||
      !Number.isFinite(volume) ||
      volume < 0
    )
      continue;
    points.set(date, {
      date,
      close,
      volume,
      adjusted:
        typeof adj === "number" && Number.isFinite(adj) && adj > 0 ? adj : null,
    });
  }
  const sorted = [...points.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  if (!sorted.length) throw new Error("No completed daily sessions returned");
  return { points: sorted, excludedOpenSession };
}

export function newestSeries(a?: MarketSeries, b?: MarketSeries) {
  if (!a) return b;
  if (!b) return a;
  const aDay = a.points.at(-1)?.date || "",
    bDay = b.points.at(-1)?.date || "";
  return bDay > aDay || (bDay === aDay && b.fetchedAt > a.fetchedAt) ? b : a;
}
