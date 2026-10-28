import { providerSymbol, validCompanySymbol } from "@/lib/company-directory";
import snapshot from "@/lib/market-snapshot.json";
import type { MarketSeries } from "@/lib/market";
import { newestSeries, parseDailyPrices } from "@/lib/market-provider";
const cache = new Map<string, { at: number; data: MarketSeries }>();
export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "INFY").toUpperCase();
  if (!validCompanySymbol(symbol))
    return Response.json(
      {
        error:
          "Choose a company from search or enter an exchange-qualified ticker.",
      },
      { status: 400 },
    );
  const saved = (snapshot as Record<string, MarketSeries>)[symbol];
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 900000)
    return Response.json({ ...newestSeries(saved, hit.data), cached: true });
  if (url.searchParams.get("refresh") !== "1" && saved && !hit)
    return Response.json({ ...saved, cached: true });
  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(providerSymbol(symbol))}?range=1y&interval=1d`,
      {
        headers: { "User-Agent": "FINN/1.0 investor-research-prototype" },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!upstream.ok) throw new Error("Market provider unavailable");
    const payload = (await upstream.json()) as {
      chart?: { result?: { meta?: { currency?: unknown } }[] };
    };
    const r = payload.chart?.result?.[0];
    const { points, excludedOpenSession } = parseDailyPrices(r);
    const data: MarketSeries = {
      symbol,
      currency:
        typeof r?.meta?.currency === "string"
          ? r.meta.currency
          : "Unknown currency",
      source: "Yahoo Finance",
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(providerSymbol(symbol))}/history/`,
      fetchedAt: new Date().toISOString(),
      points,
      cached: false,
      ...(excludedOpenSession
        ? {
            notice:
              "An unfinished trading session was excluded when these prices were fetched. Only completed daily sessions are shown.",
          }
        : {}),
    };
    const newest = newestSeries(newestSeries(saved, hit?.data), data)!;
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(symbol, { at: Date.now(), data: newest });
    return Response.json(newest);
  } catch {
    const fallback = newestSeries(saved, hit?.data);
    if (fallback)
      return Response.json({
        ...fallback,
        cached: true,
        warning:
          "The market provider could not refresh. Keeping the most recent available dated prices.",
      });
    return Response.json(
      {
        error:
          "Price history is unavailable for this listing right now. Check the selected exchange or try again later.",
      },
      { status: 502 },
    );
  }
}
