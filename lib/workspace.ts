import { companies, filings, categories } from "./finn-data";
import { validCompanySymbol } from "./company-directory";
import type { ResearchNote } from "./insights";

export type Thesis = {
  id: string;
  symbol: string;
  text: string;
  tags: string[];
};
export type AlertSettings = {
  price: number;
  volume: number;
  categories: string[];
  market: boolean;
};
export type DeskState = {
  watchlist: string[];
  saved: string[];
  notes: ResearchNote[];
  theses: Thesis[];
  settings: AlertSettings;
};
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown) =>
  Array.isArray(v)
    ? [...new Set(v.filter((x): x is string => typeof x === "string"))]
    : [];
export function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const at = Date.parse(value + "T12:00:00Z");
  return (
    Number.isFinite(at) && new Date(at).toISOString().slice(0, 10) === value
  );
}
export function safeSourceUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function restoreDeskState(raw: unknown, defaults: DeskState): DeskState {
  if (!object(raw)) return defaults;
  const notes: ResearchNote[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw.notes))
    for (const n of raw.notes) {
      if (
        !object(n) ||
        typeof n.id !== "string" ||
        !n.id ||
        seen.has(n.id) ||
        typeof n.symbol !== "string" ||
        !validCompanySymbol(n.symbol) ||
        typeof n.title !== "string" ||
        typeof n.text !== "string" ||
        typeof n.createdAt !== "string" ||
        !Number.isFinite(Date.parse(n.createdAt))
      )
        continue;
      seen.add(n.id);
      notes.push({
        id: n.id,
        symbol: n.symbol,
        title: n.title,
        text: n.text,
        createdAt: n.createdAt,
        ...(validDay(n.reviewOn) ? { reviewOn: n.reviewOn } : {}),
        resolved: n.resolved === true,
        sources: Array.isArray(n.sources)
          ? n.sources.flatMap((s) =>
              object(s) && typeof s.title === "string"
                ? [{ title: s.title, url: safeSourceUrl(s.url) }]
                : [],
            )
          : [],
      });
    }
  const theses: Thesis[] = [];
  seen.clear();
  if (Array.isArray(raw.theses))
    for (const t of raw.theses) {
      if (
        !object(t) ||
        typeof t.id !== "string" ||
        !t.id ||
        seen.has(t.id) ||
        typeof t.symbol !== "string" ||
        !validCompanySymbol(t.symbol) ||
        typeof t.text !== "string"
      )
        continue;
      seen.add(t.id);
      theses.push({
        id: t.id,
        symbol: t.symbol,
        text: t.text,
        tags: strings(t.tags)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
      });
    }
  const settings = object(raw.settings) ? raw.settings : {};
  const bounded = (v: unknown, fallback: number, min: number, max: number) =>
    typeof v === "number" && Number.isFinite(v)
      ? Math.min(max, Math.max(min, v))
      : fallback;
  return {
    watchlist: Array.isArray(raw.watchlist)
      ? strings(raw.watchlist).filter((s) =>
          companies.some((c) => c.symbol === s),
        )
      : defaults.watchlist,
    saved: Array.isArray(raw.saved)
      ? strings(raw.saved).filter((id) => filings.some((f) => f.id === id))
      : defaults.saved,
    notes: Array.isArray(raw.notes) ? notes : defaults.notes,
    theses: Array.isArray(raw.theses) ? theses : defaults.theses,
    settings: {
      price: bounded(settings.price, defaults.settings.price, 0.5, 10),
      volume: bounded(settings.volume, defaults.settings.volume, 1, 5),
      categories: Array.isArray(settings.categories)
        ? strings(settings.categories).filter((c) => categories.includes(c))
        : defaults.settings.categories,
      market:
        typeof settings.market === "boolean"
          ? settings.market
          : defaults.settings.market,
    },
  };
}

// A request may finish after a company changes or a newer request starts.
export function latestRequest() {
  let active: AbortController | null = null;
  return {
    cancel() {
      active?.abort();
      active = null;
    },
    begin() {
      active?.abort();
      const controller = new AbortController();
      active = controller;
      return {
        signal: controller.signal,
        current: () => active === controller && !controller.signal.aborted,
      };
    },
  };
}
