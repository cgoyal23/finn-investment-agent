import {
  localCompanyMatches,
  normalizeSearchQuote,
  type CompanyIdentity,
} from "@/lib/company-directory";
const cache = new Map<string, { at: number; results: CompanyIdentity[] }>();
export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") || "").trim();
  if (q.length < 2 || q.length > 80)
    return Response.json(
      {
        results: [],
        error: "Enter a company name or ticker with 2–80 characters.",
      },
      { status: 400 },
    );
  const local = localCompanyMatches(q),
    hit = cache.get(q.toLowerCase());
  if (hit && Date.now() - hit.at < 900000)
    return Response.json({ results: hit.results });
  try {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0`,
      {
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "FINN research prototype" },
      },
    );
    if (!r.ok) throw Error();
    const data = (await r.json()) as { quotes?: unknown };
    const remote: CompanyIdentity[] = (
      Array.isArray(data.quotes) ? data.quotes : []
    )
      .map(normalizeSearchQuote)
      .filter((item): item is CompanyIdentity => item !== null);
    remote.sort(
      (a, b) =>
        (a.symbol.endsWith(".NS") ? -1 : a.symbol.endsWith(".BO") ? 0 : 1) -
        (b.symbol.endsWith(".NS") ? -1 : b.symbol.endsWith(".BO") ? 0 : 1),
    );
    const results = [
      ...local,
      ...remote.filter((c) => !local.some((l) => l.symbol === c.symbol)),
    ].slice(0, 10);
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
    cache.set(q.toLowerCase(), { at: Date.now(), results });
    return Response.json({ results });
  } catch {
    return Response.json({
      results: local,
      warning:
        "Live company search is unavailable. Showing matching companies from FINN’s directory.",
    });
  }
}
