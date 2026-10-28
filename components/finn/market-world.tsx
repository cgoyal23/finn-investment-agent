"use client";
import { useEffect, useId, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Network,
  ChartNoAxesCombined,
  Pause,
  Play,
  Download,
  ScanLine,
  GitCompareArrows,
} from "lucide-react";
import { companies, evidence } from "@/lib/finn-data";
import type { MarketSeries } from "@/lib/market";
import {
  buildingFaces,
  isoPoint,
  worldCompanies,
  worldSparkline,
  type WorldCompany,
  type Point,
} from "@/lib/market-world";
import { MarketStage as ClassicMarketStage } from "./market-stage";
const pointList = (points: Point[]) => points.map((p) => p.join(",")).join(" ");
const number = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);
const palettes = [
  ["#b0c7bc", "#789e96", "#8bac9e"],
  ["#d0b87b", "#a18c5c", "#baa66d"],
  ["#8ba3b0", "#4c6b7d", "#658596"],
  ["#d5a08b", "#a97568", "#ba8978"],
];
const plots = [
  [1, 1, 75],
  [4.5, 1, 105],
  [8, 1, 68],
  [1, 4.2, 62],
  [4.5, 4.2, 82],
  [8, 4.2, 95],
  [1, 7.4, 49],
  [4.5, 7.4, 70],
];
export function MarketCity({
  entries,
  selected,
  onSelect,
}: {
  entries: WorldCompany[];
  selected: string;
  onSelect: (s: string) => void;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className="market-city-svg"
      viewBox="0 0 720 390"
      role="group"
      aria-label="Illustrative market city. Select a company building to inspect its dated prices. Building sizes do not represent financial values."
    >
      <defs>
        <pattern
          id={id + "grid"}
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1" cy="1" r=".65" fill="#a5a99a" opacity=".35" />
        </pattern>
        <filter id={id + "shadow"} x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="12"
            floodColor="#30413b"
            floodOpacity=".12"
          />
        </filter>
      </defs>
      <rect width="720" height="390" fill={`url(#${id}grid)`} />
      <circle cx="565" cy="88" r="52" fill="#e9d496" opacity=".28" />
      <circle
        cx="565"
        cy="88"
        r="65"
        fill="none"
        stroke="#c8b47e"
        strokeDasharray="2 7"
        opacity=".4"
      />
      <g filter={`url(#${id}shadow)`}>
        <polygon
          points={pointList(
            [
              isoPoint(-1, -1),
              isoPoint(11, -1),
              isoPoint(11, 10),
              isoPoint(-1, 10),
            ].map(([x, y]) => [x, y + 12]),
          )}
          fill="#b8c0b3"
        />
        <polygon
          points={pointList([
            isoPoint(-1, -1),
            isoPoint(11, -1),
            isoPoint(11, 10),
            isoPoint(-1, 10),
          ])}
          fill="#e2e4d6"
          stroke="#bfc8b9"
        />
        {[3.6, 7].map((y) => (
          <path
            key={"x" + y}
            d={`M${isoPoint(-1, y).join(",")} L${isoPoint(11, y).join(",")}`}
            stroke="#f7f7ed"
            strokeWidth="17"
          />
        ))}
        {[3.3, 6.8].map((x) => (
          <path
            key={"y" + x}
            d={`M${isoPoint(x, -1).join(",")} L${isoPoint(x, 10).join(",")}`}
            stroke="#f7f7ed"
            strokeWidth="17"
          />
        ))}
        <path
          className="city-route"
          d={`M${isoPoint(-1, 3.6).join(",")}L${isoPoint(6.8, 3.6).join(",")}L${isoPoint(6.8, 10).join(",")}`}
          stroke="#629b88"
          strokeWidth="2"
          fill="none"
          strokeDasharray="4 13"
        />
        {[...entries.map((entry, index) => ({ entry, index }))]
          .sort(
            (a, b) =>
              plots[a.index][0] +
              plots[a.index][1] -
              plots[b.index][0] -
              plots[b.index][1],
          )
          .map(({ entry, index }) => {
            const [x, y, h] = plots[index],
              faces = buildingFaces(x, y, h),
              palette = palettes[index % 4],
              active = selected === entry.symbol;
            return (
              <g
                key={entry.symbol}
                className={"city-building " + (active ? "active" : "")}
                role="button"
                tabIndex={0}
                aria-label={`Select ${companies.find((c) => c.symbol === entry.symbol)?.name || entry.symbol}`}
                aria-pressed={active}
                onClick={() => onSelect(entry.symbol)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(entry.symbol);
                  }
                }}
              >
                <title>{`${entry.symbol}: ${entry.currency} ${number(entry.close)}, session ${entry.date}. Select to inspect.`}</title>
                <polygon
                  className="building-outline"
                  points={pointList(faces.left)}
                  fill={palette[1]}
                />
                <polygon
                  className="building-outline"
                  points={pointList(faces.right)}
                  fill={palette[2]}
                />
                <polygon
                  className="building-outline"
                  points={pointList(faces.roof)}
                  fill={palette[0]}
                />
                {[1, 2, 3].flatMap((row) =>
                  [0, 1, 2].map((col) => {
                    const [wx, wy] = isoPoint(
                      x + 0.23 + col * 0.48,
                      y + 1.5,
                      17 + (row * (h - 24)) / 4,
                    );
                    return (
                      <path
                        key={row + "-" + col}
                        className="city-window"
                        d={`M${wx},${wy}l7,3.36v7l-7,-3.36Z`}
                        fill={active ? "#e9ffc0" : "#d9e7d7"}
                        opacity={active ? ".95" : ".55"}
                      />
                    );
                  }),
                )}
                <line
                  x1={faces.label[0]}
                  x2={faces.label[0]}
                  y1={faces.label[1] + 6}
                  y2={faces.label[1] + 17}
                  stroke="#365447"
                />
                <rect
                  x={faces.label[0] - 31}
                  y={faces.label[1] - 9}
                  width="62"
                  height="20"
                  rx="4"
                  fill={active ? "#d5f88a" : "#233c3b"}
                  stroke={active ? "#284939" : "#ffffff66"}
                  strokeWidth="1"
                />
                <text
                  x={faces.label[0]}
                  y={faces.label[1] + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="700"
                  fill={active ? "#1e4036" : "#f6f6e9"}
                >
                  {entry.symbol}
                </text>
                <circle
                  cx={faces.label[0] + 35}
                  cy={faces.label[1]}
                  r="3.5"
                  fill={
                    entry.change === null
                      ? "#8b9a99"
                      : entry.change >= 0
                        ? "#237f64"
                        : "#bd6a57"
                  }
                  stroke="#f9f8ef"
                  strokeWidth="1.5"
                />
              </g>
            );
          })}
      </g>
      <g aria-hidden="true">
        <text
          x="159"
          y="289"
          transform="rotate(25 159 289)"
          fill="#6f8078"
          fontSize="8"
          letterSpacing="2"
        >
          EVIDENCE AVENUE
        </text>
        <path d="M90 317l28-13 28 13-28 13z" fill="#243e3e" />
        <text
          x="118"
          y="321"
          textAnchor="middle"
          fill="#e0efc9"
          fontSize="9"
          fontFamily="monospace"
        >
          f.
        </text>
        <text x="546" y="340" fill="#6e7f76" fontSize="8" letterSpacing="2">
          THE RESEARCH DISTRICT
        </text>
      </g>
    </svg>
  );
}
export function SignalMap({
  entries,
  selected,
  onSelect,
}: {
  entries: WorldCompany[];
  selected: string;
  onSelect: (s: string) => void;
}) {
  return (
    <svg
      className="market-city-svg signal-map-svg"
      viewBox="0 0 720 390"
      role="group"
      aria-label="Company signal map. Connections are a navigation illustration, not statistical correlations."
    >
      <ellipse
        cx="360"
        cy="198"
        rx="220"
        ry="142"
        fill="none"
        stroke="#bdcabe"
        strokeDasharray="3 7"
      />
      <ellipse
        cx="360"
        cy="198"
        rx="150"
        ry="96"
        fill="none"
        stroke="#dce3d5"
      />
      {entries.map((entry, i) => {
        const angle = (i / entries.length) * Math.PI * 2 - Math.PI / 2,
          x = 360 + Math.cos(angle) * 245,
          y = 198 + Math.sin(angle) * 148,
          active = entry.symbol === selected;
        return (
          <g key={entry.symbol}>
            <path
              className="map-connection"
              d={`M360,198 Q${x},198 ${x},${y}`}
              fill="none"
              stroke={active ? "#55927c" : "#bdccbd"}
              strokeWidth={active ? 2 : 1}
              strokeDasharray={active ? "4 8" : undefined}
            />
            <g
              className={"map-company " + (active ? "active" : "")}
              role="button"
              tabIndex={0}
              aria-label={`Select ${entry.symbol} on signal map`}
              aria-pressed={active}
              onClick={() => onSelect(entry.symbol)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(entry.symbol);
                }
              }}
            >
              <rect
                x={x - 48}
                y={y - 24}
                width="96"
                height="48"
                rx="8"
                fill={active ? "#203e39" : "#fdfdf7"}
                stroke={active ? "#203e39" : "#b6c6ba"}
              />
              <text
                x={x}
                y={y - 3}
                textAnchor="middle"
                fill={active ? "#e4f4ca" : "#2e4a42"}
                fontSize="11"
                fontFamily="monospace"
                fontWeight="700"
              >
                {entry.symbol}
              </text>
              <text
                x={x}
                y={y + 13}
                textAnchor="middle"
                fill={
                  active
                    ? "#cae59f"
                    : entry.change === null
                      ? "#647c72"
                      : entry.change >= 0
                        ? "#14795f"
                        : "#aa5447"
                }
                fontSize="10"
              >
                {entry.change === null
                  ? "No comparison"
                  : `${entry.change >= 0 ? "+" : ""}${entry.change.toFixed(2)}%`}
              </text>
            </g>
          </g>
        );
      })}
      <circle cx="360" cy="198" r="48" fill="#eff3df" stroke="#819b82" />
      <circle
        cx="360"
        cy="198"
        r="40"
        fill="none"
        stroke="#becba7"
        strokeDasharray="2 5"
      />
      <text
        x="360"
        y="198"
        textAnchor="middle"
        fill="#294638"
        fontSize="27"
        fontFamily="Georgia"
      >
        finn.
      </text>
      <text
        x="360"
        y="215"
        textAnchor="middle"
        fill="#6c7e63"
        fontSize="6"
        letterSpacing="1"
      >
        FOLLOW THE EVIDENCE
      </text>
    </svg>
  );
}
export function MarketWorld({
  markets,
  symbols,
  onResearch,
  onCompare,
  onExport,
}: {
  markets: Record<string, MarketSeries>;
  symbols: string[];
  onResearch: (symbol: string) => void;
  onCompare: () => void;
  onExport: () => void;
}) {
  const [mode, setMode] = useState("city"),
    [symbol, setSymbol] = useState("INFY"),
    [paused, setPaused] = useState(false);
  const entries = worldCompanies(symbols, markets),
    selected = entries.find((e) => e.symbol === symbol) || entries[0],
    company = companies.find((c) => c.symbol === selected?.symbol);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("finn-world-view");
      if (["city", "map", "chart"].includes(saved || "")) setMode(saved!);
    } catch {}
  }, []);
  const chooseMode = (value: string) => {
    setMode(value);
    try {
      localStorage.setItem("finn-world-view", value);
    } catch {}
  };
  const series = selected?.points.slice(-22) || [],
    path = worldSparkline(series.map((p) => p.close));
  const sourceCount = evidence.filter(
    (e) => e.symbol === selected?.symbol,
  ).length;
  return (
    <section
      className={"market-world " + (paused ? "world-still" : "")}
      aria-label="Interactive investment field guide"
    >
      <div className="world-toolbar">
        <span className="world-edition">
          <i />
          FINN FIELD GUIDE<span>VOL. 01</span>
        </span>
        <div
          className="world-modes"
          role="group"
          aria-label="Choose your market view"
        >
          {[
            { id: "city", name: "Market City", icon: Building2 },
            { id: "map", name: "Signal Map", icon: Network },
            { id: "chart", name: "Chart Desk", icon: ChartNoAxesCombined },
          ].map((m) => (
            <button
              key={m.id}
              aria-pressed={mode === m.id}
              className={mode === m.id ? "active" : ""}
              onClick={() => chooseMode(m.id)}
            >
              <m.icon size={13} />
              {m.name}
            </button>
          ))}
        </div>
        <button
          className="world-pause"
          aria-label={paused ? "Resume scene motion" : "Pause scene motion"}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
      {mode === "chart" ? (
        <div className="world-classic">
          <ClassicMarketStage
            markets={markets}
            onResearch={onResearch}
            onCompare={onCompare}
            onExport={onExport}
          />
        </div>
      ) : (
        <>
          <div className="world-intro">
            <div>
              <span className="world-chapter">
                01 /{" "}
                {mode === "city"
                  ? "THE RESEARCH DISTRICT"
                  : "A DIFFERENT PERSPECTIVE"}
              </span>
              <h1>
                Big picture.
                <br />
                <em>Sharper questions.</em>
              </h1>
            </div>
            <p>
              {mode === "city"
                ? "Every company has a story. Pick a building, explore the numbers, and follow the evidence."
                : "A new way to find your next question. Pick a company and connect its market movement to its own reports."}
            </p>
          </div>
          <div className="world-experience">
            <div className="world-scene">
              <div className="world-scene-hint">
                <ScanLine size={12} />
                {mode === "city"
                  ? "Choose a company to explore"
                  : "Choose a signal to investigate"}
                <span>{entries.length} companies in view</span>
              </div>
              <div className="world-canvas">
                {mode === "city" ? (
                  <MarketCity
                    entries={entries}
                    selected={selected?.symbol || ""}
                    onSelect={setSymbol}
                  />
                ) : (
                  <SignalMap
                    entries={entries}
                    selected={selected?.symbol || ""}
                    onSelect={setSymbol}
                  />
                )}
              </div>
              <div className="world-legend">
                <span>
                  <i />
                  Latest session up
                </span>
                <span>
                  <i />
                  Latest session down
                </span>
                <small>
                  {mode === "city"
                    ? "Illustrative city · building size is decorative"
                    : "Illustrative map · lines are not correlations"}
                </small>
              </div>
            </div>
            {selected ? (
              <aside
                className="world-ticket"
                aria-label="Selected company snapshot"
              >
                <div className="ticket-head">
                  <span>COMPANY PASSPORT</span>
                  <ArrowUpRight size={16} />
                </div>
                <div className="ticket-identity">
                  <span>{selected.symbol.slice(0, 1)}</span>
                  <div>
                    <h2>{company?.name || selected.symbol}</h2>
                    <p>
                      {selected.symbol} · {selected.currency}
                    </p>
                  </div>
                </div>
                <div className="ticket-value" aria-live="polite">
                  <strong>
                    {selected.currency === "INR"
                      ? "₹"
                      : selected.currency + " "}
                    {number(selected.close)}
                  </strong>
                  <span
                    className={
                      selected.change !== null && selected.change < 0
                        ? "down"
                        : ""
                    }
                  >
                    {selected.change !== null && selected.change < 0 ? (
                      <ArrowDownRight size={14} />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}{" "}
                    {selected.change === null
                      ? "—"
                      : `${selected.change >= 0 ? "+" : ""}${selected.change.toFixed(2)}%`}
                    <small>latest session</small>
                  </span>
                </div>
                <svg
                  key={selected.symbol}
                  viewBox="0 0 240 80"
                  className="ticket-sparkline"
                  role="img"
                  aria-label={`${selected.symbol} closing prices over ${series.length} sessions`}
                >
                  <path
                    d="M0 20H240M0 50H240"
                    stroke="#d8e2d0"
                    strokeDasharray="2 5"
                  />
                  <path
                    className="ticket-price-line"
                    d={path}
                    pathLength="1"
                    fill="none"
                    stroke="#397965"
                    strokeWidth="2"
                  />
                </svg>
                <div className="ticket-dates">
                  <span>{series[0]?.date}</span>
                  <span>{selected.date}</span>
                </div>
                <dl>
                  <div>
                    <dt>Sector</dt>
                    <dd>{company?.sector || "Company research"}</dd>
                  </div>
                  <div>
                    <dt>Saved primary sources</dt>
                    <dd>{sourceCount || "Discover in research"}</dd>
                  </div>
                </dl>
                <button
                  className="ticket-research"
                  onClick={() => onResearch(selected.symbol)}
                >
                  Open company research
                  <ArrowRight size={15} />
                </button>
                <div className="ticket-tear" />
                <span className="ticket-barcode" aria-hidden="true" />
                <p className="ticket-source">
                  Yahoo Finance · dated closing prices
                  <br />
                  Unadjusted · no live quote or forecast
                </p>
              </aside>
            ) : (
              <div className="world-empty">
                <h2>Your next question starts here.</h2>
                <p>Add companies to your watchlist to populate the district.</p>
                <button
                  className="button primary"
                  onClick={() => onResearch("INFY")}
                >
                  Explore a company
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
          <div
            className="world-company-nav"
            role="group"
            aria-label="Select a company from the market view"
          >
            {entries.map((e) => (
              <button
                key={e.symbol}
                className={e.symbol === selected?.symbol ? "active" : ""}
                aria-pressed={e.symbol === selected?.symbol}
                onClick={() => setSymbol(e.symbol)}
              >
                <span />
                {e.symbol}
                <ArrowUpRight size={10} />
              </button>
            ))}
          </div>
          <div className="world-footer">
            <span>LOOK CLOSER. ASK BETTER.</span>
            <button onClick={onCompare}>
              <GitCompareArrows size={12} />
              Compare companies
              <ArrowUpRight size={12} />
            </button>
            <button onClick={onExport}>
              <Download size={12} />
              Export briefing
            </button>
          </div>
        </>
      )}
    </section>
  );
}
