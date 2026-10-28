export type IndexedDocument = {
  id: string;
  title: string;
  url: string;
  kind: string;
  date?: string;
};
const clean = (s: string) =>
  s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
export function parsePrimaryDocuments(
  html: string,
  symbol: string,
): IndexedDocument[] {
  const docs: IndexedDocument[] = [];
  const start = html.indexOf('id="documents"');
  if (start < 0) return [];
  for (const match of html
    .slice(start)
    .matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = match[1].replace(/&amp;/g, "&"),
      inner = match[2],
      title = clean(inner.split(/<(?:div|span|time)\b/i)[0]);
    if (!href.startsWith("https://") || !title || !/\.pdf(?:\?|$)/i.test(href))
      continue;
    let host: string;
    try {
      host = new URL(href).hostname;
    } catch {
      continue;
    }
    const exchange = /(^|\.)(bseindia\.com|nseindia\.com)$/.test(host);
    if (
      !exchange &&
      !/(annual|report|transcript|concall|earning)/i.test(href + " " + title)
    )
      continue;
    const date = inner.match(
      /<time\b[^>]*datetime=["'](\d{4}-\d{2}-\d{2})/i,
    )?.[1];
    const kind = /transcript|concall/i.test(href + " " + title)
      ? "Earnings-call transcript"
      : /annual/i.test(title)
        ? "Annual report"
        : date && exchange
          ? "Exchange announcement"
          : "Company document";
    if (docs.some((d) => d.url === href)) continue;
    docs.push({
      id: `${symbol}-D${docs.length + 1}`,
      title: title.slice(0, 180),
      url: href,
      kind,
      ...(date ? { date } : {}),
    });
  }
  const selected = [
    ...docs.filter((d) => d.date).slice(0, 6),
    ...docs.filter((d) => d.kind === "Earnings-call transcript").slice(0, 3),
    ...docs.filter((d) => d.kind === "Annual report").slice(0, 3),
  ];
  return [
    ...new Map(
      [...selected, ...docs.slice(0, 3)].map((d) => [d.url, d]),
    ).values(),
  ].slice(0, 12);
}
