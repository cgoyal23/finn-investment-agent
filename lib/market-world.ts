import type { MarketSeries } from "./market";
export type WorldCompany = {
  symbol: string;
  close: number;
  date: string;
  change: number | null;
  points: MarketSeries["points"];
  currency: string;
};
export function worldCompanies(
  symbols: string[],
  markets: Record<string, MarketSeries>,
): WorldCompany[] {
  return [...new Set(symbols)]
    .flatMap((symbol) => {
      const series = markets[symbol],
        points =
          series?.points.filter(
            (p) => Number.isFinite(p.close) && p.close > 0,
          ) || [];
      const last = points.at(-1),
        previous = points.at(-2);
      if (!last) return [];
      return [
        {
          symbol,
          close: last.close,
          date: last.date,
          change: previous ? (last.close / previous.close - 1) * 100 : null,
          points,
          currency: series.currency,
        },
      ];
    })
    .slice(0, 8);
}
export type Point = [number, number];
export function isoPoint(x: number, y: number, z = 0): Point {
  return [360 + (x - y) * 25, 110 + (x + y) * 12 - z];
}
export function buildingFaces(x: number, y: number, height: number) {
  const w = 1.75,
    d = 1.5;
  const a = isoPoint(x, y, height),
    b = isoPoint(x + w, y, height),
    c = isoPoint(x + w, y + d, height),
    e = isoPoint(x, y + d, height);
  return {
    roof: [a, b, c, e],
    left: [e, c, isoPoint(x + w, y + d), isoPoint(x, y + d)],
    right: [b, c, isoPoint(x + w, y + d), isoPoint(x + w, y)],
    label: isoPoint(x + w / 2, y + d / 2, height + 13),
  };
}
export function worldSparkline(values: number[], width = 240, height = 80) {
  if (values.length < 2 || values.some((v) => !Number.isFinite(v) || v <= 0))
    return "";
  const min = Math.min(...values),
    max = Math.max(...values),
    span = max - min;
  return values
    .map(
      (v, i) =>
        `${i ? "L" : "M"}${((i / (values.length - 1)) * width).toFixed(2)},${(height - 8 - (span ? (v - min) / span : 0.5) * (height - 16)).toFixed(2)}`,
    )
    .join(" ");
}
