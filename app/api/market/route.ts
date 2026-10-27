import snapshot from "@/lib/market-snapshot.json";
import type { MarketSeries } from "@/lib/market";
const cache = new Map<string, { at: number; data: MarketSeries }>();
export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") || "INFY")
    .toUpperCase()
    .replace(/\.NS$/, "");
  if (!/^[A-Z0-9&-]{1,24}$/.test(symbol))
    return Response.json(
      { error: "Enter a valid NSE symbol." },
      { status: 400 },
    );
  const saved = (snapshot as Record<string, MarketSeries>)[symbol];
  if (url.searchParams.get("refresh") !== "1" && saved)
    return Response.json({ ...saved, cached: true });
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < 900000)
    return Response.json({ ...hit.data, cached: true });
  try {
    const upstream = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}.NS?range=1y&interval=1d`,
      {
        headers: { "User-Agent": "FINN/1.0 investor-research-prototype" },
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!upstream.ok) throw new Error("Market provider unavailable");
    const payload = (await upstream.json()) as any;
    const r = payload.chart?.result?.[0];
    if (!r?.timestamp?.length) throw new Error("No prices returned");
    const q = r.indicators.quote[0],
      adj = r.indicators.adjclose?.[0]?.adjclose || [];
    const points = r.timestamp
      .map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString().slice(0, 10),
        close: q.close[i],
        adjusted: adj[i] ?? null,
        volume: q.volume[i] || 0,
      }))
      .filter((p: any) => Number.isFinite(p.close));
    const data: MarketSeries = {
      symbol,
      currency: r.meta.currency || "INR",
      source: "Yahoo Finance",
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}.NS/history/`,
      fetchedAt: new Date().toISOString(),
      points,
      cached: false,
    };
    cache.set(symbol, { at: Date.now(), data });
    return Response.json(data);
  } catch {
    if (saved)
      return Response.json({
        ...saved,
        cached: true,
        warning:
          "The market provider could not refresh. Showing the dated, real-price snapshot.",
      });
    return Response.json(
      {
        error:
          "Price history is unavailable for this symbol right now. Check the NSE symbol or try again later.",
      },
      { status: 502 },
    );
  }
}
