import type { MarketSeries, PricePoint } from "./market";
export type ComparisonLine = {
  symbol: string;
  points: { date: string; value: number; raw: number }[];
  change: number;
};
export function alignComparison(
  series: MarketSeries[],
  sessions: number,
  adjusted = true,
): ComparisonLine[] {
  if (series.length < 2) return [];
  const valid = (p: PricePoint) =>
    Number.isFinite(adjusted ? p.adjusted : p.close) &&
    (adjusted ? p.adjusted! : p.close) > 0;
  const maps = series.map(
    (s) => new Map(s.points.filter(valid).map((p) => [p.date, p])),
  );
  const dates = [...maps[0].keys()]
    .filter((d) => maps.every((m) => m.has(d)))
    .sort()
    .slice(-sessions);
  if (dates.length < 2) return [];
  return series.map((s, i) => {
    const first = maps[i].get(dates[0])!;
    const base = adjusted ? first.adjusted! : first.close;
    const points = dates.map((date) => {
      const p = maps[i].get(date)!;
      const raw = adjusted ? p.adjusted! : p.close;
      return { date, raw, value: (raw / base) * 100 };
    });
    return { symbol: s.symbol, points, change: points.at(-1)!.value - 100 };
  });
}
export function maxDrawdown(values: number[]): number | null {
  if (!values.length || values.some((v) => !Number.isFinite(v) || v <= 0))
    return null;
  let peak = values[0],
    worst = 0;
  for (const v of values) {
    peak = Math.max(peak, v);
    worst = Math.min(worst, (v / peak - 1) * 100);
  }
  return worst;
}
export function financialRatio(
  numerator: number,
  denominator: number,
): number | null {
  return Number.isFinite(numerator) &&
    Number.isFinite(denominator) &&
    denominator !== 0
    ? (numerator / denominator) * 100
    : null;
}
export type ResearchNote = {
  id: string;
  symbol: string;
  title: string;
  text: string;
  createdAt: string;
  reviewOn?: string;
  resolved?: boolean;
  sources: { title: string; url: string }[];
};
export function notebookMarkdown(notes: ResearchNote[]) {
  return (
    "# My FINN research notebook\n\nExported " +
    new Date().toISOString() +
    "\n\n" +
    notes
      .map(
        (n) =>
          "## " +
          n.title +
          "\n\n" +
          n.symbol +
          " · " +
          n.createdAt +
          "\n\n" +
          (n.reviewOn
            ? "Review: " +
              n.reviewOn +
              " · " +
              (n.resolved ? "Resolved" : "Open") +
              "\n\n"
            : "") +
          n.text +
          "\n\n" +
          n.sources
            .map(
              (s) =>
                "- " +
                s.title +
                (s.url ? " — " + s.url : " (user-provided source)"),
            )
            .join("\n"),
      )
      .join("\n\n---\n\n")
  );
}
export const glossary = [
  {
    term: "Revenue",
    group: "Results",
    meaning:
      "The money a company earns from selling its products or services, before subtracting costs.",
    example: "A company sells 1,000 items for ₹100 each. Revenue is ₹1,00,000.",
  },
  {
    term: "PAT",
    group: "Results",
    meaning:
      "Profit after tax: what is left after expenses and taxes. The reporting basis can change who receives this profit.",
    example:
      "Revenue of ₹100 less ₹70 of costs and ₹9 of tax leaves PAT of ₹21.",
  },
  {
    term: "PBT",
    group: "Results",
    meaning: "Profit before tax: earnings after costs, but before income tax.",
    example: "PBT of ₹30 less tax of ₹9 leaves PAT of ₹21.",
  },
  {
    term: "EBITDA",
    group: "Results",
    meaning:
      "Earnings before interest, tax, depreciation and amortisation. A measure of operating earnings, not cash in the bank.",
    example:
      "EBITDA and EBIT differ because EBIT includes depreciation and amortisation charges.",
  },
  {
    term: "EBIT",
    group: "Results",
    meaning:
      "Earnings before interest and tax. Keep it separate from EBITDA when reading a results table.",
    example:
      "If EBITDA is ₹30 and depreciation/amortisation is ₹5, EBIT is ₹25.",
  },
  {
    term: "Margin",
    group: "Results",
    meaning:
      "A particular profit figure expressed as a percentage of revenue. Always check which profit measure is used.",
    example: "PAT of ₹20 on revenue of ₹100 means a net profit margin of 20%.",
  },
  {
    term: "YoY",
    group: "Comparisons",
    meaning:
      "Year on year: comparing a period with the same period one year earlier.",
    example:
      "Compare July–September 2026 with July–September 2025 to reduce seasonal differences.",
  },
  {
    term: "QoQ",
    group: "Comparisons",
    meaning:
      "Quarter on quarter: comparing a quarter with the immediately preceding quarter.",
    example:
      "Compare July–September with April–June in the same year. Seasonality can influence the result.",
  },
  {
    term: "Basis points",
    group: "Comparisons",
    meaning:
      "A precise way to describe a change in a percentage. 100 basis points equals one percentage point.",
    example:
      "A margin moving from 20% to 21% increases by 100 basis points, not by 1% relative growth.",
  },
  {
    term: "Constant currency",
    group: "Comparisons",
    meaning:
      "A comparison that attempts to remove exchange-rate movements so the underlying business trend is easier to see.",
    example:
      "Reported dollar revenue and constant-currency growth can move differently. Do not substitute one for the other.",
  },
  {
    term: "Guidance",
    group: "Research",
    meaning:
      "An expectation management explicitly gives for a future period. It is an outlook, not a guarantee.",
    example:
      "Full-year growth guidance of 5–7% should be compared with that full year, not with one quarter.",
  },
  {
    term: "Cash flow",
    group: "Research",
    meaning:
      "The actual cash entering and leaving the company. Accounting profit can rise while cash generation falls.",
    example: "A sale on credit may count as revenue before the customer pays.",
  },
  {
    term: "Free cash flow",
    group: "Research",
    meaning:
      "Commonly cash from operations minus capital spending. Check the company’s exact definition.",
    example:
      "Operating cash of ₹100 less capital spending of ₹40 leaves free cash flow of ₹60.",
  },
  {
    term: "Debt",
    group: "Research",
    meaning:
      "Money the company has borrowed and must service or repay. Debt alone is incomplete without cash, earnings and repayment dates.",
    example:
      "Two companies with equal debt can have very different repayment capacity.",
  },
  {
    term: "Volume",
    group: "Charts",
    meaning:
      "The number of shares traded in a session. More volume means more trading activity, not automatically buying pressure or a good investment.",
    example:
      "Today’s 3 lakh shares divided by the previous 20-session average of 1 lakh gives 3× volume.",
  },
  {
    term: "Adjusted close",
    group: "Charts",
    meaning:
      "A provider-adjusted price series that accounts for corporate actions under the provider’s methodology.",
    example:
      "A share split can sharply change an unadjusted price even when the holding’s value has not halved.",
  },
  {
    term: "Drawdown",
    group: "Charts",
    meaning:
      "A fall from an earlier peak. Maximum drawdown is the largest such decline within the selected historical period.",
    example: "A move from ₹100 to ₹80 before recovering is a 20% drawdown.",
  },
];

export type ReviewBaseline = Record<string, { date: string; close: number }>;
export function reviewChanges(
  markets: Record<string, MarketSeries>,
  symbols: string[],
  baseline: ReviewBaseline,
) {
  return symbols
    .flatMap((symbol) => {
      const latest = markets[symbol]?.points.at(-1),
        prior = baseline[symbol];
      if (
        !latest ||
        !prior ||
        latest.date <= prior.date ||
        !Number.isFinite(prior.close) ||
        prior.close <= 0
      )
        return [];
      return [
        {
          symbol,
          date: latest.date,
          from: prior.date,
          change: (latest.close / prior.close - 1) * 100,
        },
      ];
    })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
export function noteReviewState(note: ResearchNote, today: string) {
  if (note.resolved) return "Resolved";
  if (
    note.reviewOn &&
    /^\d{4}-\d{2}-\d{2}$/.test(note.reviewOn) &&
    note.reviewOn <= today
  )
    return "Due";
  return "Open";
}
