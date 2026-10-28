export type PricePoint = {
  date: string;
  close: number;
  adjusted: number | null;
  volume: number;
};
export type MarketSeries = {
  symbol: string;
  currency: string;
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  points: PricePoint[];
  cached?: boolean;
  warning?: string;
  notice?: string;
};
export function percentChange(
  current: number,
  previous: number,
): number | null {
  return Number.isFinite(current) && Number.isFinite(previous) && previous !== 0
    ? (current / previous - 1) * 100
    : null;
}
export function marketStats(points: PricePoint[]) {
  const last = points.at(-1),
    prior = points.at(-2);
  const previous = points.slice(-21, -1);
  const average = previous.length
    ? previous.reduce((s, p) => s + p.volume, 0) / previous.length
    : 0;
  return {
    last,
    change: last && prior ? percentChange(last.close, prior.close) : null,
    volumeRatio:
      last && previous.length >= 20 && average > 0
        ? last.volume / average
        : null,
    averageVolume: average,
    high: points.length ? Math.max(...points.map((p) => p.close)) : null,
    low: points.length ? Math.min(...points.map((p) => p.close)) : null,
  };
}
export function rangePoints(points: PricePoint[], range: string) {
  const n =
    range === "1M"
      ? 22
      : range === "3M"
        ? 66
        : range === "6M"
          ? 132
          : points.length;
  return points.slice(-n);
}
export function filterFilings<
  T extends {
    date: string;
    priority: string;
    category: string;
    symbol: string;
  },
>(
  items: T[],
  options: {
    days: number;
    now: string;
    category: string;
    symbol: string;
    routine: boolean;
  },
) {
  const end = Date.parse(options.now + "T23:59:59Z");
  return items.filter(
    (f) =>
      (options.days === 0 ||
        (Date.parse(f.date + "T00:00:00Z") >= end - options.days * 86400000 &&
          Date.parse(f.date + "T00:00:00Z") <= end)) &&
      (options.category === "All" || f.category === options.category) &&
      (options.symbol === "All" || f.symbol === options.symbol) &&
      (options.routine || f.priority !== "Routine"),
  );
}
export function watchMatches(
  thesis: { symbol: string; tags: string[] },
  filing: { symbol: string; title: string; summary: string; why: string },
) {
  return (
    thesis.symbol === filing.symbol &&
    thesis.tags.some((t) =>
      (filing.title + " " + filing.summary + " " + filing.why)
        .toLowerCase()
        .includes(t.toLowerCase()),
    )
  );
}
