import type { DiscoveredDocument } from "./discovery";
let directory: { at: number; rows: unknown[][] } | undefined;
const headers = {
  "User-Agent":
    "FINN educational research prototype (repository: github.com/cgoyal23/finn-investment-agent)",
  Accept: "application/json",
};
export async function discoverSecDocuments(
  symbol: string,
): Promise<DiscoveredDocument[]> {
  if (!directory || Date.now() - directory.at > 86400000) {
    const r = await fetch(
      "https://www.sec.gov/files/company_tickers_exchange.json",
      { headers, signal: AbortSignal.timeout(7000) },
    );
    if (!r.ok) throw Error("SEC directory unavailable");
    const json = (await r.json()) as { data?: unknown };
    directory = {
      at: Date.now(),
      rows: Array.isArray(json.data) ? json.data.filter(Array.isArray) : [],
    };
  }
  const row = directory.rows.find(
    (r) =>
      String(r[2]).toUpperCase() === symbol.replace(/\.US$/, "").toUpperCase(),
  );
  if (!row) return [];
  if (!/^\d{1,10}$/.test(String(row[0])))
    throw Error("Invalid SEC company identifier");
  const cik = String(row[0]).padStart(10, "0"),
    r = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers,
      signal: AbortSignal.timeout(7000),
    });
  if (!r.ok) throw Error("SEC filings unavailable");
  const data = (await r.json()) as {
      name?: string;
      filings?: {
        recent?: {
          form: string[];
          accessionNumber: string[];
          primaryDocument: string[];
          filingDate: string[];
        };
      };
    },
    recent = data.filings?.recent;
  if (
    !recent ||
    !Array.isArray(recent.form) ||
    !Array.isArray(recent.accessionNumber) ||
    !Array.isArray(recent.primaryDocument) ||
    !Array.isArray(recent.filingDate)
  )
    return [];
  const docs: DiscoveredDocument[] = [];
  for (let i = 0; i < recent.form.length && docs.length < 12; i++) {
    const form = recent.form[i];
    if (!["10-K", "10-Q", "20-F", "6-K", "8-K"].includes(form)) continue;
    const accession = String(recent.accessionNumber[i]).replaceAll("-", ""),
      filename = String(recent.primaryDocument[i]);
    if (!/^\d+$/.test(accession) || !/^[\w.-]+$/.test(filename)) continue;
    docs.push({
      id: `SEC-${accession}`,
      title: `${data.name} · ${form} · ${recent.filingDate[i]}`,
      date: recent.filingDate[i],
      kind: ["10-K", "20-F"].includes(form)
        ? "Annual report"
        : form === "10-Q"
          ? "Financial statements"
          : "Regulatory disclosure",
      url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession}/${filename}`,
    });
  }
  return docs;
}
