import { companies } from "./finn-data";
export type CompanyIdentity = {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  sector?: string;
  investorUrl?: string;
  aliases?: string[];
};
export const companyDirectory: CompanyIdentity[] = [
  ...companies.map((c) => ({
    symbol: c.symbol,
    name: c.name,
    exchange: "NSE",
    currency: "INR",
    sector: c.sector,
  })),
  {
    symbol: "005930.KS",
    name: "Samsung Electronics",
    exchange: "KRX · South Korea",
    currency: "KRW",
    sector: "Technology",
    aliases: ["samsung", "samsung electronics", "005930"],
    investorUrl: "https://www.samsung.com/global/ir/",
  },
  {
    symbol: "AAPL.US",
    name: "Apple",
    exchange: "NASDAQ · United States",
    currency: "USD",
    sector: "Technology",
    aliases: ["apple", "aapl"],
    investorUrl: "https://investor.apple.com/",
  },
  {
    symbol: "MSFT.US",
    name: "Microsoft",
    exchange: "NASDAQ · United States",
    currency: "USD",
    sector: "Technology",
    aliases: ["microsoft", "msft"],
    investorUrl: "https://www.microsoft.com/en-us/Investor/",
  },
  {
    symbol: "NVDA.US",
    name: "NVIDIA",
    exchange: "NASDAQ · United States",
    currency: "USD",
    sector: "Technology",
    aliases: ["nvidia", "nvda"],
    investorUrl: "https://investor.nvidia.com/",
  },
];
export function validCompanySymbol(s: string) {
  return /^[A-Z0-9&-]{1,24}(?:\.[A-Z]{1,4})?$/.test(s);
}
export function providerSymbol(s: string) {
  return s.endsWith(".US") ? s.slice(0, -3) : s.includes(".") ? s : s + ".NS";
}
export function localCompanyMatches(q: string) {
  const query = q.trim().toLowerCase();
  return query
    ? companyDirectory
        .filter((c) =>
          [c.name, c.symbol, ...(c.aliases || [])].some((s) =>
            s.toLowerCase().includes(query),
          ),
        )
        .slice(0, 10)
    : [];
}
export function normalizeSearchQuote(q: any): CompanyIdentity | null {
  if (
    q.quoteType !== "EQUITY" ||
    typeof q.symbol !== "string" ||
    typeof (q.longname || q.shortname) !== "string"
  )
    return null;
  let symbol = q.symbol.toUpperCase();
  if (!symbol.includes(".")) symbol += ".US";
  const known = companyDirectory.find(
    (c) => providerSymbol(c.symbol) === q.symbol.toUpperCase(),
  );
  if (known) return known;
  if (!validCompanySymbol(symbol)) return null;
  return {
    symbol,
    name: (q.longname || q.shortname).slice(0, 120),
    exchange: String(q.exchDisp || q.exchange || "Exchange unconfirmed").slice(
      0,
      60,
    ),
    currency: "",
  };
}
