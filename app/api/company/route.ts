import { companyDirectory, validCompanySymbol } from "@/lib/company-directory";
import { discoverDocuments } from "@/lib/discovery";
import { evidence, filings } from "@/lib/finn-data";
export async function GET(request: Request) {
  const symbol = (
    new URL(request.url).searchParams.get("symbol") || ""
  ).toUpperCase();
  if (!validCompanySymbol(symbol))
    return Response.json(
      { error: "Choose a valid company from search." },
      { status: 400 },
    );
  const found = await discoverDocuments(symbol);
  const announcements = filings
    .filter((f) => f.symbol === symbol)
    .map((f) => ({
      title: f.title,
      date: f.date,
      summary: f.summary,
      url: evidence.find((e) => e.id === f.source)?.url || "",
      kind: f.category,
    }));
  for (const doc of found.documents
    .filter((d) => d.date && !announcements.some((a) => a.url === d.url))
    .slice(0, 8))
    announcements.push({
      title: doc.title,
      date: doc.date!,
      summary:
        "Open the company’s original filing to inspect the reporting period, results and risks.",
      url: doc.url,
      kind: doc.kind,
    });
  if (symbol === "005930.KS")
    announcements.push(
      {
        title: "3Q 2026 pre-earnings guidance",
        date: "2026-10-08",
        summary:
          "Samsung lists its third-quarter pre-earnings guidance in official public disclosures. Read the original for estimates and reporting basis.",
        url: "https://www.samsung.com/global/ir/reports-disclosures/public-disclosure/",
        kind: "Guidance",
      },
      {
        title: "Third-quarter earnings release scheduled",
        date: "2026-10-08",
        summary:
          "The official investor-relations page schedules the third-quarter earnings call for 29 October 2026, 10:00 KST. This is a scheduled event, not reported third-quarter results.",
        url: "https://www.samsung.com/global/ir/",
        kind: "Upcoming earnings",
      },
    );
  return Response.json({
    identity: companyDirectory.find((c) => c.symbol === symbol) || null,
    ...found,
    announcements: announcements.sort((a, b) => b.date.localeCompare(a.date)),
    evidence: evidence.filter((e) => e.symbol === symbol),
    notice:
      "Selected verified disclosures and discovered documents; not a complete live exchange feed.",
  });
}
