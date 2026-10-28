"use client";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  GitCompareArrows,
  NotebookPen,
  Gamepad2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { companies } from "@/lib/finn-data";
import { marketStats, type MarketSeries } from "@/lib/market";
import { worldSparkline } from "@/lib/market-world";

export function MobileDesk({
  markets,
  symbols,
  signals,
  saved,
  onResearch,
  onSearch,
  onGo,
}: {
  markets: Record<string, MarketSeries>;
  symbols: string[];
  signals: number;
  saved: number;
  onResearch: (symbol: string) => void;
  onSearch: () => void;
  onGo: (view: "compare" | "notebook" | "arcade") => void;
}) {
  const entries = symbols.flatMap((symbol) => {
    const series = markets[symbol];
    if (!series?.points.length) return [];
    return [{ symbol, series, ...marketStats(series.points) }];
  });
  const up = entries.filter((e) => e.change !== null && e.change > 0).length;
  const down = entries.filter((e) => e.change !== null && e.change < 0).length;
  const latest = entries
    .map((e) => e.last!.date)
    .sort()
    .at(-1);
  const movers = [...entries]
    .filter((e) => e.change !== null)
    .sort((a, b) => Math.abs(b.change!) - Math.abs(a.change!))
    .slice(0, 4);
  return (
    <section className="mobile-desk" aria-label="Your market overview">
      <div className="mobile-desk-title">
        <div>
          <span className="eyebrow">YOUR DAILY LENS</span>
          <h1>
            A clearer
            <br />
            <em>market day.</em>
          </h1>
        </div>
        <span className="session-stamp">
          <span className="tiny-dot" />
          EOD snapshot<time>{latest || "No prices yet"}</time>
        </span>
      </div>
      <button className="mobile-search" onClick={onSearch}>
        <Search size={19} />
        <span>Find a company</span>
        <small>Name or ticker</small>
        <ArrowRight size={16} />
      </button>
      <div className="mobile-metrics">
        <div>
          <strong>{symbols.length}</strong>
          <span>On your radar</span>
        </div>
        <div>
          <strong>{signals}</strong>
          <span>Alert matches</span>
        </div>
        <div>
          <strong>{saved}</strong>
          <span>Saved insights</span>
        </div>
      </div>
      <div className="mobile-shortcuts">
        <button onClick={() => onGo("compare")}>
          <span>
            <GitCompareArrows size={20} />
          </span>
          Compare
        </button>
        <button onClick={() => onGo("notebook")}>
          <span>
            <NotebookPen size={20} />
          </span>
          My notes
        </button>
        <button onClick={() => onGo("arcade")}>
          <span>
            <Gamepad2 size={20} />
          </span>
          Play & learn
        </button>
      </div>
      {!!entries.length && (
        <div className="market-breadth">
          <div>
            <strong>Your watchlist pulse</strong>
            <span>
              <TrendingUp size={13} />
              {up} up <TrendingDown size={13} />
              {down} down
            </span>
          </div>
          <div
            className="breadth-bar"
            aria-label={`${up} rising, ${down} falling, ${entries.length - up - down} unchanged or unavailable`}
          >
            <i style={{ width: `${(100 * up) / entries.length}%` }} />
            <i style={{ width: `${(100 * down) / entries.length}%` }} />
          </div>
          <small>Latest available sessions · no forecast</small>
        </div>
      )}
      {!!movers.length && (
        <>
          <div className="mobile-section-heading">
            <h2>Moves to explore</h2>
            <span>
              Tap for the evidence <ArrowUpRight size={13} />
            </span>
          </div>
          <div className="mover-deck">
            {movers.map((e) => (
              <button
                key={e.symbol}
                className={e.change! < 0 ? "mover negative" : "mover positive"}
                onClick={() => onResearch(e.symbol)}
              >
                <span className="mover-label">
                  <strong>{e.symbol}</strong>
                  <ArrowUpRight size={14} />
                </span>
                <span className="mover-name">
                  {companies.find((c) => c.symbol === e.symbol)?.name ||
                    e.symbol}
                </span>
                <svg viewBox="0 0 120 34" aria-hidden="true">
                  <path
                    d={worldSparkline(
                      e.series.points.slice(-22).map((p) => p.close),
                      120,
                      34,
                    )}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                <span className="mover-change">
                  {e.change! > 0 ? "+" : ""}
                  {e.change!.toFixed(2)}%<small>{e.last!.date}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
