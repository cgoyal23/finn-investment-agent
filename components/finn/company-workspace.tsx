"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  FileText,
  RefreshCw,
  LoaderCircle,
  Activity,
} from "lucide-react";
import {
  marketStats,
  rangePoints,
  percentChange,
  type MarketSeries,
} from "@/lib/market";
import type { CompanyIdentity } from "@/lib/company-directory";
type CompanyData = {
  documents: {
    id: string;
    title: string;
    url: string;
    kind: string;
    date?: string;
  }[];
  announcements: {
    title: string;
    date: string;
    summary: string;
    url: string;
    kind: string;
  }[];
  evidence: {
    id: string;
    title: string;
    url: string;
    facts: string;
    date: string;
  }[];
  warning?: string;
  notice?: string;
};
export function CompanyWorkspace({
  symbol,
  identity,
  initial,
  chart,
  onAsk,
}: {
  symbol: string;
  identity?: CompanyIdentity | null;
  initial?: MarketSeries;
  chart: (
    series: MarketSeries,
    range: string,
    onRange: (r: string) => void,
  ) => ReactNode;
  onAsk: (question: string) => void;
}) {
  const [series, setSeries] = useState<MarketSeries | undefined>(initial),
    [data, setData] = useState<CompanyData | null>(null),
    [range, setRange] = useState("3M"),
    [loading, setLoading] = useState(true),
    [refresh, setRefresh] = useState(0),
    [priceError, setPriceError] = useState(""),
    [sourceError, setSourceError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setPriceError("");
    setSourceError("");
    setData(null);
    setSeries(initial);
    const prices = fetch(
      `/api/market?symbol=${encodeURIComponent(symbol)}${refresh ? "&refresh=1" : ""}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        const d: any = await r.json();
        if (!r.ok || !d.points?.length)
          throw Error(d.error || "No prices returned.");
        if (!controller.signal.aborted) setSeries(d);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setPriceError(
            e instanceof Error ? e.message : "Prices are unavailable.",
          );
      });
    const sources = fetch("/api/company?symbol=" + encodeURIComponent(symbol), {
      signal: controller.signal,
    })
      .then(async (r) => {
        const d: any = await r.json();
        if (!r.ok) throw Error(d.error);
        if (!controller.signal.aborted) setData(d);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setSourceError(
            "Reports could not load. Retry or add an official source extract below.",
          );
      });
    Promise.allSettled([prices, sources]).then(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [symbol, refresh, initial]);
  const stats = series ? marketStats(series.points) : null,
    points = series ? rangePoints(series.points, range) : [],
    change =
      points.length > 1
        ? percentChange(points.at(-1)!.close, points[0].close)
        : null;
  return (
    <div className="company-workspace" id="company-overview">
      <section className="panel company-price-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">THE COMPANY AT A GLANCE</div>
            <h2>Price & trading activity</h2>
          </div>
          <button
            className="button secondary"
            disabled={loading}
            onClick={() => setRefresh((v) => v + 1)}
          >
            <RefreshCw size={13} className={loading ? "spinning" : ""} />
            Refresh
          </button>
        </div>
        {series?.points.length ? (
          <>
            {chart(series, range, setRange)}
            <a
              className="company-price-source"
              href={series.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {series.source} · {series.currency} · latest session{" "}
              {series.points.at(-1)?.date}
              <ArrowUpRight size={12} />
            </a>
            {series.warning && (
              <p role="status" className="company-data-warning">
                {series.warning}
              </p>
            )}
            <div className="company-observations">
              <div>
                <Activity size={16} />
                <strong>
                  {change === null
                    ? "Insufficient history"
                    : `${change >= 0 ? "+" : ""}${change.toFixed(2)}% over ${points.length} sessions`}
                </strong>
                <p>
                  Calculated from unadjusted closing prices in the selected
                  period.
                </p>
              </div>
              <div>
                <Activity size={16} />
                <strong>
                  {stats?.volumeRatio == null
                    ? "Volume comparison unavailable"
                    : `${stats.volumeRatio.toFixed(2)}× recent average volume`}
                </strong>
                <p>
                  Latest session compared with the previous 20 sessions,
                  excluding the latest.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="company-load-state" role="status">
            {loading ? (
              <>
                <LoaderCircle size={22} className="spinning" />
                <p>Loading the company’s available price history…</p>
              </>
            ) : (
              <>
                <p>
                  {priceError ||
                    "Price history is unavailable for this listing."}
                </p>
                <p>Reports and source-backed research can still be used.</p>
              </>
            )}
          </div>
        )}
        {priceError && series && (
          <p className="company-data-warning">
            Refresh failed. Retaining the dated prices above.
          </p>
        )}
        <p className="company-analysis-note">
          Price observations describe historical trading, not why it moved.
          Splits and dividends can affect unadjusted prices.{" "}
          {identity?.exchange || "Check the selected exchange"} · no currency
          conversion applied.
        </p>
      </section>
      <div className="company-evidence-grid">
        <section className="panel">
          <div className="section-header">
            <h2>Reports & announcements</h2>
            <FileText size={17} />
          </div>
          {data?.announcements.slice(0, 4).map((a, i) => (
            <a
              className="company-announcement"
              key={a.url + a.title + i}
              href={a.url}
              target="_blank"
              rel="noreferrer"
            >
              <div>
                <span>{a.kind}</span>
                <time>{a.date}</time>
              </div>
              <strong>
                {a.title}
                <ArrowUpRight size={13} />
              </strong>
              <p>{a.summary}</p>
            </a>
          ))}
          {!data?.announcements.length && (
            <p className="company-analysis-note">
              {loading
                ? "Finding company disclosures…"
                : "No dated announcements were verified by the connected source. This does not mean the company has made no announcements."}
            </p>
          )}
          {data?.documents.slice(0, 5).map((d) => (
            <a
              className="company-document"
              key={d.id}
              href={d.url}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={14} />
              <span>
                {d.title}
                <small>
                  {d.kind}
                  {d.date ? " · " + d.date : ""}
                </small>
              </span>
              <ArrowUpRight size={13} />
            </a>
          ))}
          <p className="company-analysis-note">
            {sourceError || data?.warning || data?.notice}
          </p>
        </section>
        <section className="panel company-analysis">
          <div className="eyebrow">BEYOND THE CHART</div>
          <h2>What the evidence tells us</h2>
          {data?.evidence.length ? (
            data.evidence.slice(0, 2).map((e) => (
              <div key={e.id}>
                <p>{e.facts}</p>
                <a href={e.url} target="_blank" rel="noreferrer">
                  {e.title} · {e.date}
                  <ArrowUpRight size={12} />
                </a>
              </div>
            ))
          ) : (
            <p>
              {loading
                ? "Checking available research evidence…"
                : data?.documents.length
                  ? "Company reports are available below. Ask FINN to read supported reports and explain the business, financial performance and risks."
                  : "No business-analysis evidence has been loaded yet. Add an annual-report or earnings-call extract below; FINN will analyse that evidence instead of inventing company facts."}
            </p>
          )}
          <button
            className="button primary"
            onClick={() =>
              onAsk(
                "Summarise the business, latest available financial performance, and the main risks using only the supplied company reports. Give the dates and reporting basis, cite sources, and state missing evidence.",
              )
            }
          >
            Analyse company reports
            <ArrowUpRight size={14} />
          </button>
          <small>
            Google sign-in required for AI research. Financial evidence coverage
            varies by company and exchange.
          </small>
        </section>
      </div>
    </div>
  );
}
