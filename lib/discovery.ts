import { parsePrimaryDocuments } from "./document-parser";
import { discoverSecDocuments } from "./sec-discovery";
import { companyDirectory } from "./company-directory";
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

  const identity = companyDirectory.find((c) => c.symbol === symbol);
  if (symbol === "005930.KS") {
    return {
      documents: [
        ...saved,
        {
          id: "SAMSUNG-EARNINGS",
          title: "Quarterly earnings releases and presentations",
          url: "https://www.samsung.com/global/ir/financial-information/earnings-release/",
          kind: "Official investor relations",
        },
        {
          id: "SAMSUNG-DISCLOSURES",
          title: "Samsung Electronics public disclosures",
          url: "https://www.samsung.com/global/ir/reports-disclosures/public-disclosure/",
          kind: "Official disclosures",
        },
      ],
      warning:
        "Samsung sources include a verified July 2026 presentation and official disclosure pages. The source list is not a complete live announcement feed.",
    };
  }
  if (symbol.endsWith(".US")) {
    try {
      const sec = await discoverSecDocuments(symbol);
      return {
        documents: sec,
        ...(sec.length
          ? {}
          : {
              warning:
                "No SEC reports found for this ticker. Add a primary-source extract.",
            }),
      };
    } catch {
      return {
        documents: identity?.investorUrl
          ? [
              {
                id: symbol + "-IR",
                title: identity.name + " investor relations",
                url: identity.investorUrl,
                kind: "Official investor relations",
              },
            ]
          : [
              {
                id: symbol + "-SEC-SEARCH",
                title: "Find this company’s official SEC filings",
                url:
                  "https://www.sec.gov/edgar/search/#/q=" +
                  encodeURIComponent(symbol.replace(/\.US$/, "")),
                kind: "Official filing search",
              },
            ],
        warning:
          "The SEC report provider is unavailable. Charts still work; add an official report extract for business analysis.",
      };
    }
  }
  if (symbol.includes(".") && !/\.(NS|BO)$/.test(symbol)) {
    return {
      documents: identity?.investorUrl
        ? [
            {
              id: symbol + "-IR",
              title: identity.name + " investor relations",
              url: identity.investorUrl,
              kind: "Official investor relations",
            },
          ]
        : [],
      warning:
        "Automatic report ingestion is not available for this exchange. Open the official reports and add a primary-source extract for financial analysis.",
    };
  }
  try {
    const r = await fetch(
      `https://www.screener.in/company/${encodeURIComponent(symbol.replace(/\.(NS|BO)$/, ""))}/consolidated/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FINN research prototype)",
        },
        signal: AbortSignal.timeout(10000),
      },
    );
    if (!r.ok) throw new Error();
    const html = await r.text();
    const docs = parsePrimaryDocuments(html, symbol);
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
