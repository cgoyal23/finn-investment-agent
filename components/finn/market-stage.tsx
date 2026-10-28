"use client";
import { useId, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Pause,
  Play,
  Download,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { companies } from "@/lib/finn-data";
import { marketStats, type MarketSeries } from "@/lib/market";

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(n);
export function MarketRibbon({
  markets,
  symbols,
  onSelect,
}: {
  markets: Record<string, MarketSeries>;
  symbols: string[];
  onSelect: (symbol: string) => void;
}) {
  const [paused, setPaused] = useState(false);
  const entries = symbols
    .filter((s) => markets[s]?.points.length > 1)
    .slice(0, 12);
  return (
    <section
      className={"market-ribbon " + (paused ? "is-paused" : "")}
      aria-label="Dated share-price snapshot"
    >
      <div className="ribbon-label">
        <Activity size={14} />
        <span>
          MARKET
          <br />
          <strong>SNAPSHOT</strong>
        </span>
      </div>
      <div className="ribbon-window">
        <div className="ribbon-track">
          {[0, 1].map((copy) => (
            <div
              className="ribbon-group"
              key={copy}
              aria-hidden={copy === 1 ? true : undefined}
            >
              {entries.map((symbol) => {
                const stats = marketStats(markets[symbol].points),
                  change = stats.change!;
                return (
                  <button
                    key={symbol}
                    tabIndex={copy === 1 ? -1 : 0}
                    onClick={() => onSelect(symbol)}
                    aria-label={`${symbol}, ${money(stats.last!.close)} rupees, ${change.toFixed(2)} percent change on ${stats.last!.date}`}
                  >
                    <strong>{symbol}</strong>
                    <span>₹{money(stats.last!.close)}</span>
                    <small
                      className={change >= 0 ? "market-up" : "market-down"}
                    >
                      {change >= 0 ? (
                        <ArrowUpRight size={11} />
                      ) : (
                        <ArrowDownRight size={11} />
                      )}{" "}
                      {Math.abs(change).toFixed(2)}%
                    </small>
                    <time>{stats.last!.date}</time>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <button
        className="ribbon-pause"
        onClick={() => setPaused(!paused)}
        aria-label={paused ? "Resume price ribbon" : "Pause price ribbon"}
        aria-pressed={paused}
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </section>
  );
}

export function MarketStage({
  markets,
  onResearch,
  onCompare,
  onExport,
}: {
  markets: Record<string, MarketSeries>;
  onResearch: (symbol: string) => void;
  onCompare: () => void;
  onExport: () => void;
}) {
  const [symbol, setSymbol] = useState("INFY");
  const gradient = useId().replace(/:/g, "");
  const series = markets[symbol],
    points = series?.points.slice(-66) || [];
  const last = points.at(-1),
    first = points[0];
  const change = last && first ? (last.close / first.close - 1) * 100 : null;
  const up = (change ?? 0) >= 0;
  const values = points.map((p) => p.close),
    min = Math.min(...values),
    max = Math.max(...values);
  const x = (i: number) => 12 + (i / Math.max(1, points.length - 1)) * 436;
  const y = (v: number) => 162 - ((v - min) / Math.max(1, max - min)) * 130;
  const path = points
    .map(
      (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.close).toFixed(1)}`,
    )
    .join(" ");
  return (
    <section
      className="market-stage"
      aria-label="Your investment research overview"
    >
      <div className="stage-copy">
        <div className="stage-kicker">
          <span />
          THE INVESTOR’S ADVANTAGE
        </div>
        <h1>
          Find the signal.
          <br />
          <em>Follow the evidence.</em>
        </h1>
        <p>
          Turn market movements into better questions.
          <br className="stage-desktop-break" /> Your companies. Their numbers.
          The full picture.
        </p>
        <div className="stage-actions">
          <button className="button primary" onClick={() => onResearch(symbol)}>
            Explore a company <ArrowUpRight size={16} />
          </button>
          <button className="stage-compare" onClick={onCompare}>
            Compare stocks <ArrowRight size={14} />
          </button>
        </div>
        <div className="stage-trust">
          <ShieldCheck size={13} />
          PRIMARY SOURCES. CLEARER DECISIONS.
        </div>
      </div>
      <div className="stage-market">
        <div className="stage-chart-top">
          <span>
            <i />
            COMPANY LENS
          </span>
          <div role="group" aria-label="Featured chart company">
            {["INFY", "TCS", "RELIANCE"].map((s) => (
              <button
                key={s}
                aria-pressed={symbol === s}
                className={symbol === s ? "selected" : ""}
                onClick={() => setSymbol(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="stage-quote">
          <div>
            <span>{companies.find((c) => c.symbol === symbol)?.name}</span>
            <strong>{last ? "₹" + money(last.close) : "Unavailable"}</strong>
          </div>
          <span className={"stage-return " + (!up ? "negative" : "")}>
            {up ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}{" "}
            {change !== null ? `${up ? "+" : ""}${change.toFixed(2)}%` : "—"}
            <small>66 sessions</small>
          </span>
        </div>
        <svg
          key={symbol}
          className="stage-chart"
          viewBox="0 0 460 196"
          role="img"
          aria-label={`${symbol} unadjusted closing prices across ${points.length} sessions, ${first?.date || ""} to ${last?.date || ""}`}
        >
          <defs>
            <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
              <stop
                offset="0%"
                stopColor={up ? "#62e1c1" : "#f29ca8"}
                stopOpacity=".32"
              />
              <stop
                offset="100%"
                stopColor={up ? "#62e1c1" : "#f29ca8"}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          {[32, 76, 120, 164].map((v) => (
            <line
              key={v}
              x1="12"
              x2="448"
              y1={v}
              y2={v}
              stroke="#ffffff12"
              strokeDasharray="3 5"
            />
          ))}
          {points.length > 1 && (
            <>
              <path
                d={`${path} L448,174 L12,174 Z`}
                fill={`url(#${gradient})`}
              />
              <path
                className="stage-chart-line"
                pathLength="1"
                d={path}
                fill="none"
                stroke={up ? "#62e1c1" : "#f29ca8"}
                strokeWidth="2.6"
                strokeLinejoin="round"
              />
              <circle
                cx={448}
                cy={y(last!.close)}
                r="4"
                fill={up ? "#92f5d8" : "#f29ca8"}
                stroke="#112c3c"
                strokeWidth="2"
              />
            </>
          )}
          <text x="12" y="192" fill="#91a7bd" fontSize="10">
            {first?.date}
          </text>
          <text x="448" y="192" textAnchor="end" fill="#91a7bd" fontSize="10">
            {last?.date}
          </text>
        </svg>
        <div className="stage-chart-footer">
          <span>Yahoo Finance · EOD snapshot · unadjusted</span>
          <button
            onClick={() => onResearch(symbol)}
            aria-label={`Research ${symbol}`}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
      <button className="stage-export" onClick={onExport}>
        <Download size={13} />
        Export briefing
      </button>
    </section>
  );
}
