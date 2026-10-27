import { evidence } from "./finn-data";
export type DiscoveredDocument = {
  id: string;
  title: string;
  url: string;
  kind: string;
  date?: string;
};
export async function discoverDocuments(
  symbol: string,
): Promise<{ documents: DiscoveredDocument[]; warning?: string }> {
  const saved = evidence
    .filter((e) => e.symbol === symbol)
    .map((e) => ({
      id: e.id,
      title: e.title,
      url: e.url,
      kind: e.kind,
      date: e.date,
    }));
  try {
    const r = await fetch(
      `https://www.screener.in/company/${encodeURIComponent(symbol)}/consolidated/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FINN research prototype)",
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!r.ok) throw new Error();
    const html = await r.text();
    const docArea = html.slice(Math.max(0, html.indexOf('id="documents"')));
    const docs: DiscoveredDocument[] = [];
    for (const match of docArea.matchAll(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    )) {
      const href = match[1].replace(/&amp;/g, "&"),
        label = match[2]
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      if (!href.startsWith("https://") || !label) continue;
      const host = new URL(href).hostname;
      if (!/\.pdf(?:\?|$)/i.test(href)) continue;
      if (
        !/(bseindia\.com|nseindia\.com)$/.test(host) &&
        !/(annual|report|transcript|concall|earning)/i.test(href + " " + label)
      )
        continue;
      docs.push({
        id: `${symbol}-D${docs.length + 1}`,
        title: label.slice(0, 150),
        url: href,
        kind: /transcript|concall/i.test(href + " " + label)
          ? "Earnings-call transcript"
          : "Company document",
      });
      if (docs.length >= 10) break;
    }
    return {
      documents: [
        ...saved,
        ...docs.filter((d) => !saved.some((s) => s.url === d.url)),
      ],
      ...(docs.length
        ? {}
        : {
            warning:
              "No additional documents were discovered. You can supply a primary-source extract in Research.",
          }),
    };
  } catch {
    return {
      documents: saved,
      warning:
        "Automatic document discovery is unavailable. Saved sources remain accessible; supply a primary-source extract to research another company.",
    };
  }
}
export function safePrimaryUrl(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.port &&
      !/^(localhost|.*\.local|\d[\d.]*)$/.test(u.hostname) &&
      !u.hostname.includes(":")
    );
  } catch {
    return false;
  }
}
