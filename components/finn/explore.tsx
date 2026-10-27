"use client";
import { useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Download,
  FileText,
  Info,
  Plus,
  Search,
  Target,
  Trash2,
  X,
  BookOpen,
  Bookmark,
  Layers,
} from "lucide-react";
import { companies, evidence, filings, type Filing } from "@/lib/finn-data";
import {
  alignComparison,
  maxDrawdown,
  financialRatio,
  notebookMarkdown,
  glossary,
  type ResearchNote,
} from "@/lib/insights";
import type { MarketSeries } from "@/lib/market";
const colors = ["#315f4c", "#b79049", "#7c6aa6", "#c47564"];
function date(d: string) {
  return new Date(d + "T12:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function delta(v: number) {
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}
function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
export function WelcomeGuide({
  onGo,
  onLearn,
}: {
  onGo: (v: string) => void;
  onLearn: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  return dismissed ? null : (
    <section className="welcome-guide">
      <div className="guide-intro">
        <span className="guide-label">YOUR FIRST FIVE MINUTES</span>
        <h2>
          A clearer view starts
          <br />
          with one good question.
        </h2>
        <p>New to FINN? Start here. No finance background needed.</p>
      </div>
      <div className="guide-steps">
        <button onClick={() => onGo("portfolio")}>
          <span>01</span>
          <div>
            <strong>Notice a movement</strong>
            <small>Explore real prices and trading activity.</small>
          </div>
          <ArrowUpRight size={16} />
        </button>
        <button onClick={() => onGo("research")}>
          <span>02</span>
          <div>
            <strong>Understand the business</strong>
            <small>Open the documents behind an insight.</small>
          </div>
          <ArrowUpRight size={16} />
        </button>
        <button onClick={onLearn}>
          <span>03</span>
          <div>
            <strong>Make the numbers make sense</strong>
            <small>Plain-English definitions and examples.</small>
          </div>
          <ArrowUpRight size={16} />
        </button>
      </div>
      <button
        className="guide-dismiss icon-button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss getting started guide"
      >
        <X size={16} />
      </button>
    </section>
  );
}
export function CompareExplorer({
  markets,
  onResearch,
}: {
  markets: Record<string, MarketSeries>;
  onResearch: (s: string) => void;
}) {
  const [selected, setSelected] = useState(["INFY", "TCS"]);
  const [range, setRange] = useState("3M");
  const [adjusted, setAdjusted] = useState(true);
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const series = useMemo(
    () =>
      alignComparison(
        selected.map((s) => markets[s]).filter(Boolean),
        range === "1M" ? 22 : range === "3M" ? 66 : range === "6M" ? 132 : 260,
        adjusted,
      ),
    [selected, range, adjusted, markets],
  );
  const points = series[0]?.points || [];
  const values = series.flatMap((s) => s.points.map((p) => p.value));
  const low = values.length ? Math.min(100, ...values) - 3 : 90,
    high = values.length ? Math.max(100, ...values) + 3 : 110;
  const W = 900,
    H = 310,
    L = 25,
    R = 50,
    T = 20,
    B = 35;
  const x = (i: number) =>
      L + (i / Math.max(points.length - 1, 1)) * (W - L - R),
    y = (v: number) => T + ((high - v) / (high - low)) * (H - T - B);
  const index = Math.min(hover ?? points.length - 1, points.length - 1);
  const setChoice = (s: string) => {
    setHover(null);
    setSelected((v) =>
      v.includes(s)
        ? v.length > 2
          ? v.filter((n) => n !== s)
          : v
        : v.length < 4
          ? [...v, s]
          : v,
    );
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PUT THE MOVEMENTS IN PERSPECTIVE</div>
          <h1>
            Same starting line<span>.</span>
          </h1>
          <p>
            Compare up to four companies. Each starts at 100, so different share
            prices don’t get in the way.
          </p>
        </div>
        <span className="badge neutral">Real market history</span>
      </div>
      <section className="panel compare-panel">
        <div className="compare-controls">
          <div className="comparison-pills">
            {selected.map((s, i) => (
              <button
                key={s}
                onClick={() => setChoice(s)}
                title={
                  selected.length > 2
                    ? "Remove company"
                    : "At least two companies are required"
                }
              >
                <i style={{ background: colors[i] }} />
                {s}
                {selected.length > 2 && <X size={12} />}
              </button>
            ))}
            <button
              className="comparison-add"
              onClick={() => setPicker(!picker)}
            >
              <Plus size={14} />
              Choose companies
            </button>
          </div>
          <div className="range-switch">
            {["1M", "3M", "6M", "1Y"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={range === r ? "active" : ""}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        {picker && (
          <div className="comparison-picker">
            <div className="list-search">
              <Search size={15} />
              <input
                placeholder="Find a company..."
                aria-label="Find company to compare"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div>
              {companies
                .filter(
                  (c) =>
                    markets[c.symbol] &&
                    (c.name + c.symbol)
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                )
                .map((c) => (
                  <button
                    key={c.symbol}
                    onClick={() => setChoice(c.symbol)}
                    disabled={
                      !selected.includes(c.symbol) && selected.length >= 4
                    }
                  >
                    <span>
                      {c.name}
                      <small>{c.symbol}</small>
                    </span>
                    <span
                      className={
                        "selection-box " +
                        (selected.includes(c.symbol) ? "selected" : "")
                      }
                    >
                      {selected.includes(c.symbol) && <Check size={12} />}
                    </span>
                  </button>
                ))}
            </div>
            <p>
              Choose 2–4 companies. Selecting a third company lets you remove an
              existing selection.
            </p>
          </div>
        )}
        <div className="compare-basis">
          <label>
            <input
              type="checkbox"
              checked={adjusted}
              onChange={(e) => {
                setAdjusted(e.target.checked);
                setHover(null);
              }}
            />
            Use provider-adjusted prices
          </label>
          <span>
            {points.length
              ? date(points[0].date) + " – " + date(points.at(-1)!.date)
              : "No common price dates"}
          </span>
        </div>
        {series.length ? (
          <>
            <svg
              ref={svg}
              viewBox={`0 0 ${W} ${H}`}
              className="comparison-chart"
              role="img"
              aria-label="Share-price comparison rebased to 100 on common dates"
              onPointerMove={(e) => {
                const r = svg.current!.getBoundingClientRect();
                setHover(
                  Math.min(
                    points.length - 1,
                    Math.max(
                      0,
                      Math.round(
                        ((((e.clientX - r.left) / r.width) * W - L) /
                          (W - L - R)) *
                          (points.length - 1),
                      ),
                    ),
                  ),
                );
              }}
              onPointerLeave={() => setHover(null)}
            >
              {[0, 1, 2, 3, 4].map((i) => {
                const value = low + ((high - low) * i) / 4;
                return (
                  <g key={i}>
                    <line
                      x1={L}
                      x2={W - R}
                      y1={y(value)}
                      y2={y(value)}
                      stroke="#e7ece3"
                      strokeDasharray="3 5"
                    />
                    <text
                      x={W - R + 10}
                      y={y(value) + 4}
                      fontSize="11"
                      fill="#7e8c76"
                    >
                      {value.toFixed(0)}
                    </text>
                  </g>
                );
              })}
              <line
                x1={L}
                x2={W - R}
                y1={y(100)}
                y2={y(100)}
                stroke="#b8c7ad"
                strokeDasharray="5 5"
              />
              {series.map((s, i) => (
                <path
                  key={s.symbol}
                  d={s.points
                    .map(
                      (p, j) =>
                        (j ? "L" : "M") +
                        x(j).toFixed(2) +
                        "," +
                        y(p.value).toFixed(2),
                    )
                    .join(" ")}
                  stroke={colors[i]}
                  fill="none"
                  strokeWidth="2.4"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              {hover !== null && (
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={T}
                  y2={H - B}
                  stroke="#8b9b81"
                  strokeDasharray="4 4"
                />
              )}
              {[0, Math.floor(points.length / 2), points.length - 1].map(
                (i) => (
                  <text
                    key={i}
                    x={x(i)}
                    y={H - 8}
                    fill="#819174"
                    textAnchor={i === 0 ? "start" : "middle"}
                    fontSize="10"
                  >
                    {date(points[i].date)}
                  </text>
                ),
              )}
            </svg>
            <label className="comparison-scrubber">
              Inspect a session{" "}
              <input
                type="range"
                min={0}
                max={points.length - 1}
                value={index}
                onChange={(e) => setHover(Number(e.target.value))}
              />
              <strong>{date(points[index].date)}</strong>
            </label>
            <div className="comparison-scorecards">
              {series.map((s, i) => (
                <div key={s.symbol}>
                  <div>
                    <i style={{ background: colors[i] }} />
                    <strong>{s.symbol}</strong>
                    <span>{s.points[index].value.toFixed(1)}</span>
                  </div>
                  <h3 className={s.change >= 0 ? "positive" : "negative"}>
                    {delta(s.change)}
                  </h3>
                  <p>
                    {adjusted
                      ? "Adjusted series change"
                      : "Unadjusted price change"}
                  </p>
                  <small>
                    Largest peak-to-trough fall:{" "}
                    {Math.abs(
                      maxDrawdown(s.points.map((p) => p.raw)) || 0,
                    ).toFixed(1)}
                    %
                  </small>
                  <button onClick={() => onResearch(s.symbol)}>
                    Research the business <ArrowUpRight size={12} />
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h3>These series don’t have enough matching dates.</h3>
            <p>Try another company or switch the price basis.</p>
          </div>
        )}
        <div className="chart-caption">
          <Info size={15} />
          <span>
            100 means the starting value. A reading of 110 means a 10% increase
            in that series. Only shared dates are compared. Adjusted data
            follows Yahoo Finance’s methodology and can reflect corporate
            actions; it is not an independently calculated total-return index. A
            chart comparison is not an investment recommendation.
          </span>
        </div>
      </section>
      <section className="compare-takeaway">
        <span>
          <Layers size={22} />
        </span>
        <div>
          <div className="eyebrow">THE NEXT GOOD QUESTION</div>
          <h2>Different charts. What changed inside the businesses?</h2>
          <p>
            Price history shows the difference. Company reports are where we
            investigate possible context.
          </p>
        </div>
        <button
          className="button primary"
          onClick={() => onResearch(selected[0])}
        >
          Follow the evidence <ArrowRight size={15} />
        </button>
      </section>
    </>
  );
}
export function ResearchNotebook({
  notes,
  onChange,
  onResearch,
  onToast,
}: {
  notes: ResearchNote[];
  onChange: (n: ResearchNote[]) => void;
  onResearch: (s: string) => void;
  onToast: (s: string) => void;
}) {
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [symbol, setSymbol] = useState("INFY");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const visible = notes.filter((n) =>
    (n.title + n.text + n.symbol).toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEEP THE QUESTIONS THAT MATTER</div>
          <h1>
            Your research, together<span>.</span>
          </h1>
          <p>
            Save an insight, add your own interpretation, and come back with a
            better question.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            onClick={() =>
              download(notebookMarkdown(notes), "finn-research-notebook.md")
            }
            disabled={!notes.length}
          >
            <Download size={15} />
            Export
          </button>
          <button className="button primary" onClick={() => setAdding(!adding)}>
            <Plus size={15} />
            New note
          </button>
        </div>
      </div>
      <div className="notebook-toolbar">
        <div className="list-search">
          <Search size={16} />
          <input
            aria-label="Search research notes"
            placeholder="Search notes, companies or questions..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <span>
          {notes.length} saved note{notes.length !== 1 ? "s" : ""} · stored in
          this browser
        </span>
      </div>
      {adding && (
        <form
          className="panel notebook-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim() || !text.trim()) return;
            onChange([
              {
                id: crypto.randomUUID(),
                symbol,
                title: title.trim(),
                text: text.trim(),
                createdAt: new Date().toISOString(),
                sources: [],
              },
              ...notes,
            ]);
            setTitle("");
            setText("");
            setAdding(false);
            onToast("Note saved in your research notebook.");
          }}
        >
          <h2>What’s worth remembering?</h2>
          <div className="note-editor-row">
            <label>
              Company
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
              >
                {companies.map((c) => (
                  <option value={c.symbol} key={c.symbol}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input
                required
                value={title}
                maxLength={120}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="A question to revisit next quarter"
              />
            </label>
          </div>
          <label>
            Your note
            <textarea
              required
              value={text}
              maxLength={10000}
              onChange={(e) => setText(e.target.value)}
              placeholder="What did you notice? What evidence would support or challenge it?"
            />
          </label>
          <div>
            <button
              className="text-button"
              type="button"
              onClick={() => setAdding(false)}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              <Check size={14} />
              Save note
            </button>
          </div>
        </form>
      )}
      <div className="notebook-grid">
        {visible.map((n) => (
          <article className="panel notebook-card" key={n.id}>
            <div className="note-card-top">
              <span className="badge neutral">{n.symbol}</span>
              <time>
                {new Date(n.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </div>
            <h2>{n.title}</h2>
            <p className="notebook-text">{n.text}</p>
            {n.sources.length > 0 && (
              <div className="note-sources">
                <span>SAVED WITH THE EVIDENCE</span>
                {n.sources.map((s, i) =>
                  s.url ? (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer">
                      <FileText size={12} />
                      {s.title}
                      <ArrowUpRight size={11} />
                    </a>
                  ) : (
                    <small key={i}>{s.title} · user-provided</small>
                  ),
                )}
              </div>
            )}
            <div className="notebook-card-footer">
              <button
                className="text-button"
                onClick={() => onResearch(n.symbol)}
              >
                Continue research <ArrowRight size={13} />
              </button>
              {pendingDelete === n.id ? (
                <div className="delete-confirm">
                  <span>Delete note?</span>
                  <button
                    onClick={() => {
                      onChange(notes.filter((x) => x.id !== n.id));
                      setPendingDelete(null);
                      onToast("Note deleted.");
                    }}
                  >
                    Delete
                  </button>
                  <button onClick={() => setPendingDelete(null)}>Keep</button>
                </div>
              ) : (
                <button
                  className="icon-button"
                  onClick={() => setPendingDelete(n.id)}
                  aria-label="Delete research note"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <section className="panel notebook-empty">
          <span>
            <Bookmark size={29} />
          </span>
          <h2>
            {notes.length
              ? "No matching notes."
              : "An idea is easier to revisit when you keep the evidence."}
          </h2>
          <p>
            {notes.length
              ? "Try a different search."
              : "Save a FINN research answer directly to this notebook, or add a question of your own. Everything stays in this browser; export it when you want a copy."}
          </p>
          <button className="button primary" onClick={() => setAdding(true)}>
            <Plus size={15} />
            Write your first note
          </button>
        </section>
      )}
    </>
  );
}
export function LearnPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [revenue, setRevenue] = useState(100);
  const [profit, setProfit] = useState(20);
  const terms = glossary.filter(
    (t) =>
      (group === "All" || t.group === group) &&
      (t.term + " " + t.meaning).toLowerCase().includes(query.toLowerCase()),
  );
  const margin = financialRatio(profit, revenue);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="learn-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Finance in plain English"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="learn-heading">
          <div>
            <div className="eyebrow">A SMALL GUIDE TO THE NUMBERS</div>
            <h2>
              Finance, in plain English<span>.</span>
            </h2>
            <p>No jargon without an explanation.</p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close finance guide"
          >
            <X size={21} />
          </button>
        </div>
        <div className="learn-search">
          <Search size={17} />
          <input
            autoFocus
            aria-label="Search financial terms"
            placeholder="Try margin, cash flow, guidance..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="learn-categories">
          {["All", "Results", "Comparisons", "Research", "Charts"].map((g) => (
            <button
              key={g}
              onClick={() => setGroup(g)}
              className={g === group ? "active" : ""}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="learn-scroll">
          {terms.map((t) => (
            <article className="glossary-term" key={t.term}>
              <div>
                <span className="badge neutral">{t.group}</span>
                <h3>{t.term}</h3>
              </div>
              <p>{t.meaning}</p>
              <div>
                <strong>For example</strong>
                <span>{t.example}</span>
              </div>
            </article>
          ))}
          {!terms.length && (
            <div className="empty-state">
              <p>No matching term. Try another word.</p>
            </div>
          )}
          <section className="margin-playground">
            <div className="eyebrow">TRY THE NUMBERS YOURSELF</div>
            <h3>How does a margin work?</h3>
            <p>These are fictional inputs for learning, not company figures.</p>
            <div>
              <label>
                Revenue (₹)
                <input
                  type="number"
                  value={revenue}
                  onChange={(e) => setRevenue(Number(e.target.value))}
                />
              </label>
              <label>
                Profit (₹)
                <input
                  type="number"
                  value={profit}
                  onChange={(e) => setProfit(Number(e.target.value))}
                />
              </label>
              <span>
                <small>Profit ÷ revenue × 100</small>
                <strong>
                  {margin === null ? "Not defined" : margin.toFixed(1) + "%"}
                </strong>
              </span>
            </div>
            {margin === null && (
              <p>A margin cannot be calculated with zero revenue.</p>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
export function EventTimeline({
  symbol,
  onOpen,
}: {
  symbol: string;
  onOpen: (f: Filing) => void;
}) {
  const entries = filings
    .filter((f) => f.symbol === symbol && f.priority !== "Routine")
    .map((f) => ({
      id: f.id,
      date: f.date,
      title: f.title,
      body: f.summary,
      url: evidence.find((s) => s.id === f.source)?.url || "",
      filing: f,
      kind: f.category,
    }));
  if (symbol === "INFY") {
    const guide = evidence.find((e) => e.id === "INFY-CALL25")!;
    entries.push({
      id: guide.id,
      date: guide.date,
      title: "The original outlook",
      body: "Management set FY2026 growth guidance of 0–3% in constant currency and an operating-margin range of 20–22%.",
      url: guide.url,
      filing: null as any,
      kind: "Management commentary",
    });
  }
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className="panel event-timeline">
      <div className="eyebrow">READ THE DISCLOSURES AS A STORY</div>
      <h2>What happened, and what came next?</h2>
      <p>
        Selected historical records for {symbol}. This is a partial timeline,
        not a complete event feed or an explanation of share-price changes.
      </p>
      <div>
        {entries.map((e, i) => (
          <article key={e.id}>
            <span className="timeline-node">{i + 1}</span>
            <div>
              <time>{date(e.date)}</time>
              <span className="badge neutral">{e.kind}</span>
              <h3>{e.title}</h3>
              <p>{e.body}</p>
              {e.filing ? (
                <button
                  className="text-button"
                  onClick={() => onOpen(e.filing)}
                >
                  Inspect this disclosure <ArrowUpRight size={13} />
                </button>
              ) : (
                <a
                  className="text-button"
                  href={e.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the original commentary <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
      {!entries.length && (
        <div className="empty-state">
          <FileText size={25} />
          <h3>No verified timeline yet.</h3>
          <p>
            Research this company’s primary documents before drawing a
            narrative.
          </p>
        </div>
      )}
    </section>
  );
}
