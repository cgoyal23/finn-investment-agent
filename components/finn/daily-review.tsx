"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Check, ArrowRight } from "lucide-react";
import type { MarketSeries } from "@/lib/market";
import { reviewChanges, type ReviewBaseline } from "@/lib/insights";

export function DailyReview({
  markets,
  symbols,
  storageKey,
  onUpdate,
  onResearch,
}: {
  markets: Record<string, MarketSeries>;
  symbols: string[];
  storageKey: string;
  onUpdate: (series: MarketSeries) => void;
  onResearch: (symbol: string) => void;
}) {
  const [baseline, setBaseline] = useState<ReviewBaseline>({});
  const [reviewed, setReviewed] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    // Hydrate the browser-only review after mount; the server has no localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBaseline({});
    setReviewed("");
    setMessage("");
    try {
      const saved = JSON.parse(
        localStorage.getItem(storageKey + "-review") || "null",
      );
      if (saved?.baseline && typeof saved.baseline === "object") {
        const safe: ReviewBaseline = {};
        for (const [symbol, item] of Object.entries(saved.baseline)) {
          const value = item as { date?: unknown; close?: unknown } | null;
          if (
            value &&
            typeof value.date === "string" &&
            typeof value.close === "number" &&
            Number.isFinite(value.close) &&
            value.close > 0
          )
            safe[symbol] = { date: value.date, close: value.close };
        }
        setBaseline(safe);
        if (typeof saved.reviewed === "string") setReviewed(saved.reviewed);
      }
    } catch {
      setMessage("Your previous review could not be restored in this browser.");
    }
  }, [storageKey]);
  const changes = reviewChanges(markets, symbols, baseline);
  const dates = symbols
    .map((s) => markets[s]?.points.at(-1)?.date)
    .filter((d): d is string => !!d)
    .sort();
  const markReviewed = () => {
    const next: ReviewBaseline = {};
    symbols.forEach((s) => {
      const p = markets[s]?.points.at(-1);
      if (p) next[s] = { date: p.date, close: p.close };
    });
    const at = new Date().toISOString();
    try {
      localStorage.setItem(
        storageKey + "-review",
        JSON.stringify({ baseline: next, reviewed: at }),
      );
      setBaseline(next);
      setReviewed(at);
      setMessage(
        "Review saved. Future price sessions will be compared with this baseline.",
      );
    } catch {
      setMessage(
        "Could not save this review. Browser storage may be full or unavailable.",
      );
    }
  };
  const refresh = async () => {
    setBusy(true);
    let success = 0,
      failed = 0;
    // Two requests at a time keeps the provider and the browser responsive.
    for (let i = 0; i < symbols.length; i += 2) {
      await Promise.all(
        symbols.slice(i, i + 2).map(async (symbol) => {
          try {
            const response = await fetch(
              "/api/market?refresh=1&symbol=" + encodeURIComponent(symbol),
              { signal: AbortSignal.timeout(20000) },
            );
            const data = (await response.json()) as MarketSeries;
            if (
              !response.ok ||
              data.symbol !== symbol ||
              !Array.isArray(data.points) ||
              !data.points.length
            )
              throw Error();
            onUpdate(data);
            if (data.warning) failed++;
            else success++;
          } catch {
            failed++;
          }
        }),
      );
      setMessage(
        `Checked ${Math.min(i + 2, symbols.length)} of ${symbols.length} companies…`,
      );
    }
    setMessage(
      `${success} companies checked successfully. ${failed ? failed + " could not refresh; their dated prices remain visible." : "Latest available end-of-day sessions are shown."}`,
    );
    setBusy(false);
  };
  return (
    <section className="panel daily-review">
      <div className="daily-review-heading">
        <div>
          <div className="eyebrow">YOUR DAILY CHECK-IN</div>
          <h2>Since your last review</h2>
          <p>
            {reviewed
              ? "Last reviewed " + new Date(reviewed).toLocaleString("en-IN")
              : "Save your first review to start tracking changes."}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            disabled={busy || !symbols.length}
            onClick={refresh}
          >
            <RefreshCw size={14} className={busy ? "spinning" : ""} />
            {busy ? "Checking prices…" : "Refresh watchlist"}
          </button>
          <button
            className="button primary"
            disabled={busy || !dates.length}
            onClick={markReviewed}
          >
            <Check size={14} />
            Mark reviewed
          </button>
        </div>
      </div>
      <details className="data-explainer">
        <summary>
          Price coverage <span aria-hidden="true">⌄</span>
        </summary>
        <div className="data-health">
          <strong>Price sessions</strong>
          <span>
            {dates.length
              ? dates[0] === dates.at(-1)
                ? dates[0]
                : dates[0] + " to " + dates.at(-1)
              : "No price data"}
          </span>
          <span>
            {dates.length} of {symbols.length} companies have prices
          </span>
          <span>End-of-day data · no live quotes</span>
        </div>
      </details>
      {changes.length ? (
        <div className="review-movers">
          {changes.slice(0, 6).map((c) => (
            <button key={c.symbol} onClick={() => onResearch(c.symbol)}>
              <strong>{c.symbol}</strong>
              <span>
                {c.change > 0 ? "+" : ""}
                {c.change.toFixed(2)}%
              </span>
              <small>
                {c.from} → {c.date}
              </small>
              <ArrowRight size={14} />
            </button>
          ))}
        </div>
      ) : (
        <p className="review-empty">
          {reviewed
            ? "No newer price sessions than your saved baseline. Refresh to check for available data."
            : "Save a baseline. Next time, see what changed."}
        </p>
      )}
      <p className="review-footnote">
        Unadjusted prices · saved in this browser.
      </p>
      <p role="status" aria-live="polite">
        {message}
      </p>
    </section>
  );
}
