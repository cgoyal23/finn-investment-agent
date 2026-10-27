"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ArrowLeft,
  LayoutDashboard,
  ChartNoAxesCombined,
  Search,
  Bookmark,
  Bell,
  Settings2,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCheck,
  Plus,
  X,
  FileText,
  ExternalLink,
  Sparkles,
  Send,
  RefreshCw,
  Clock,
  Target,
  Layers,
  ShieldCheck,
  Download,
  Menu,
  LoaderCircle,
  SlidersHorizontal,
  Trash2,
  Info,
  Activity,
  BookOpen,
  Command,
  Flag,
} from "lucide-react";
import {
  companies,
  evidence,
  filings,
  researchProfiles,
  defaultTheses,
  categories,
  type Filing,
} from "@/lib/finn-data";
import marketSnapshot from "@/lib/market-snapshot.json";
import {
  marketStats,
  rangePoints,
  percentChange,
  filterFilings,
  watchMatches,
  type MarketSeries,
  type PricePoint,
} from "@/lib/market";

type View = "briefing" | "portfolio" | "research" | "theses" | "alerts";
type Thesis = { id: string; symbol: string; text: string; tags: string[] };
type ResearchAnswer = {
  mode: string;
  answer: string;
  citations: { id: string; title: string; url: string; locator: string }[];
  limitations?: string;
  notice?: string;
  cached?: boolean;
  model?: string;
  error?: string;
};
const snapshot = marketSnapshot as Record<string, MarketSeries>;
const navItems = [
  { id: "briefing", label: "Briefing", icon: LayoutDashboard },
  { id: "portfolio", label: "Portfolio", icon: ChartNoAxesCombined },
  { id: "research", label: "Research", icon: Search },
  { id: "theses", label: "Thesis watch", icon: Target },
  { id: "alerts", label: "Alerts", icon: Bell },
];
function money(n: number | undefined) {
  return n === undefined
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(n);
}
function changeText(n: number | null) {
  return n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
function shortDate(value: string) {
  return new Date(value + "T12:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function volume(n: number) {
  return n >= 10000000
    ? (n / 10000000).toFixed(2) + "cr"
    : n >= 100000
      ? (n / 100000).toFixed(2) + "L"
      : n.toLocaleString("en-IN");
}
function company(symbol: string) {
  return (
    companies.find((c) => c.symbol === symbol) || {
      symbol,
      name: symbol,
      sector: "NSE listed",
      color: "#567763",
    }
  );
}
function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className={"brand " + (small ? "small" : "")}>
      <span className="brand-mark">
        <i />
        <i />
        <i />
      </span>
      <span>
        finn<span className="brand-dot">.</span>
      </span>
    </div>
  );
}
function Badge({
  children,
  tone = "green",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
function CompanyMark({ symbol, size = "" }: { symbol: string; size?: string }) {
  const c = company(symbol);
  return (
    <span
      className={"company-mark " + size}
      style={{ background: c.color + "13", color: c.color }}
    >
      {symbol === "RELIANCE"
        ? "R"
        : symbol === "HDFCBANK"
          ? "H"
          : symbol === "BHARTIARTL"
            ? "A"
            : symbol.slice(0, 2)}
    </span>
  );
}
function SourceLink({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const s = evidence.find((e) => e.id === id);
  if (!s) return null;
  return (
    <a
      className={"source-link " + (compact ? "compact" : "")}
      href={
        s.url +
        (s.url.endsWith(".pdf") && s.locator.match(/Page (\d+)/)
          ? "#page=" + s.locator.match(/Page (\d+)/)![1]
          : "")
      }
      target="_blank"
      rel="noreferrer"
    >
      <FileText size={13} />
      <span>{compact ? s.kind : s.title}</span>
      <ExternalLink size={12} />
    </a>
  );
}
function MiniChart({
  points,
  positive = true,
}: {
  points: PricePoint[];
  positive?: boolean;
}) {
  const vals = points.slice(-30).map((p) => p.close);
  const lo = Math.min(...vals),
    hi = Math.max(...vals);
  const p = vals
    .map(
      (v, i) =>
        `${(i / (vals.length - 1)) * 100},${27 - ((v - lo) / (hi - lo || 1)) * 24}`,
    )
    .join(" ");
  return (
    <svg
      viewBox="0 0 100 30"
      className={"mini-chart " + (positive ? "positive" : "negative")}
      aria-hidden="true"
    >
      <polyline
        points={p}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
function PriceChart({
  series,
  range,
  onRange,
  events = true,
}: {
  series: MarketSeries;
  range: string;
  onRange: (v: string) => void;
  events?: boolean;
}) {
  const pts = rangePoints(series.points, range);
  const [hover, setHover] = useState<number | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const chartRef = useRef<SVGSVGElement>(null);
  useEffect(() => setHover(null), [series.symbol, range]);
  const W = 860,
    H = 265,
    L = 12,
    R = 68,
    T = 20,
    B = 34;
  const prices = pts.map((p) => p.close);
  const min = Math.min(...prices),
    max = Math.max(...prices),
    pad = (max - min) * 0.15 || 1;
  const lo = min - pad,
    hi = max + pad;
  const x = (i: number) => L + (i / Math.max(pts.length - 1, 1)) * (W - L - R),
    y = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const path = pts
    .map(
      (p, i) => `${i ? "L" : "M"}${x(i).toFixed(2)},${y(p.close).toFixed(2)}`,
    )
    .join(" ");
  const up = (pts.at(-1)?.close || 0) >= (pts[0]?.close || 0);
  const chosen = pts[hover ?? pts.length - 1];
  const maxVol = Math.max(...pts.map((p) => p.volume));
  const markerFilings =
    events && showEvents
      ? filings.filter(
          (f) =>
            f.symbol === series.symbol &&
            f.category === "Results" &&
            f.date >= pts[0]?.date &&
            f.date <= pts.at(-1)!.date,
        )
      : [];
  return (
    <div className="price-chart">
      <div className="chart-toolbar">
        <div>
          <span className="price-big">{money(chosen?.close)}</span>
          <span className={"price-change " + (up ? "positive" : "negative")}>
            {changeText(percentChange(pts.at(-1)!.close, pts[0].close))}{" "}
            <span className="muted">in {range.toLowerCase()}</span>
          </span>
          <p className="chart-date">
            {chosen ? shortDate(chosen.date) : ""} · Unadjusted close · INR
          </p>
        </div>
        <div className="range-switch" aria-label="Chart range">
          {["1M", "3M", "6M", "1Y"].map((r) => (
            <button
              key={r}
              className={range === r ? "active" : ""}
              onClick={() => onRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <svg
        ref={chartRef}
        viewBox={`0 0 ${W} ${H}`}
        className="main-chart"
        role="img"
        aria-label={`${series.symbol} daily closing prices. ${pts.length} sessions. Use the date slider below to inspect a day.`}
        onPointerMove={(e) => {
          const r = chartRef.current!.getBoundingClientRect();
          setHover(
            Math.min(
              pts.length - 1,
              Math.max(
                0,
                Math.round(
                  ((((e.clientX - r.left) / r.width) * W - L) / (W - L - R)) *
                    (pts.length - 1),
                ),
              ),
            ),
          );
        }}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient
            id={"area-" + series.symbol}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor={up ? "#447961" : "#bb7660"}
              stopOpacity=".16"
            />
            <stop
              offset="100%"
              stopColor={up ? "#447961" : "#bb7660"}
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((i) => {
          const v = lo + ((hi - lo) * i) / 3;
          return (
            <g key={i}>
              <line
                x1={L}
                x2={W - R + 8}
                y1={y(v)}
                y2={y(v)}
                stroke="#e9ece5"
                strokeDasharray="3 5"
              />
              <text x={W - R + 16} y={y(v) + 4} fill="#8c958b" fontSize="11">
                {Math.round(v).toLocaleString("en-IN")}
              </text>
            </g>
          );
        })}
        {showVolume &&
          pts.map((p, i) => (
            <rect
              key={p.date}
              x={x(i) - Math.max(1, ((W - R - L) / pts.length) * 0.3)}
              y={H - B - (p.volume / (maxVol || 1)) * 43}
              width={Math.max(1, ((W - R - L) / pts.length) * 0.6)}
              height={(p.volume / (maxVol || 1)) * 43}
              fill="#a1b5a4"
              opacity=".28"
            />
          ))}
        <path
          d={path + ` L ${x(pts.length - 1)},${H - B} L ${L},${H - B} Z`}
          fill={`url(#area-${series.symbol})`}
        />
        <path
          d={path}
          fill="none"
          stroke={up ? "#3e7558" : "#b07460"}
          strokeWidth="2.4"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />
        {markerFilings.map((f) => {
          const i = pts.findIndex((p) => p.date >= f.date);
          return (
            <g key={f.id}>
              <line
                x1={x(i)}
                x2={x(i)}
                y1={T}
                y2={H - B}
                stroke="#b9a267"
                strokeDasharray="3 4"
              />
              <circle
                cx={x(i)}
                cy={y(pts[i].close)}
                r="9"
                fill="#faf5e8"
                stroke="#b9a267"
              />
              <text
                x={x(i)}
                y={y(pts[i].close) + 3}
                fontSize="9"
                textAnchor="middle"
                fill="#846d39"
              >
                F
              </text>
            </g>
          );
        })}
        {[
          0,
          Math.floor(pts.length / 3),
          Math.floor((pts.length * 2) / 3),
          pts.length - 1,
        ].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 8}
            textAnchor={i === 0 ? "start" : "middle"}
            fill="#92998f"
            fontSize="11"
          >
            {new Date(pts[i].date + "T12:00Z").toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </text>
        ))}
        {hover !== null && chosen && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={T}
              y2={H - B}
              stroke="#91a994"
              strokeDasharray="4 3"
            />
            <circle
              cx={x(hover)}
              cy={y(chosen.close)}
              r="5"
              fill="#35624a"
              stroke="#fff"
              strokeWidth="2"
            />
          </g>
        )}
      </svg>
      <div className="chart-bottom">
        <div className="chart-legends">
          <button
            className={showVolume ? "selected" : ""}
            onClick={() => setShowVolume(!showVolume)}
          >
            <span className="legend-square" />
            Volume
          </button>
          <button
            className={showEvents ? "selected" : ""}
            onClick={() => setShowEvents(!showEvents)}
          >
            <span className="legend-dot" />
            Filings {markerFilings.length ? `(${markerFilings.length})` : ""}
          </button>
        </div>
        <label className="date-scrubber">
          <span>Explore</span>
          <input
            type="range"
            min={0}
            max={pts.length - 1}
            value={hover ?? pts.length - 1}
            onChange={(e) => setHover(Number(e.target.value))}
            aria-label="Inspect chart date"
          />
        </label>
      </div>
    </div>
  );
}
export default function Home() {
  const [view, setView] = useState<View>("briefing");
  const [symbol, setSymbol] = useState("INFY");
  const [range, setRange] = useState("6M");
  const [allMarkets, setAllMarkets] =
    useState<Record<string, MarketSeries>>(snapshot);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedFiling, setSelectedFiling] = useState<Filing | null>(null);
  const [watchlist, setWatchlist] = useState(companies.map((c) => c.symbol));
  const [saved, setSaved] = useState<string[]>([]);
  const [theses, setTheses] = useState<Thesis[]>(defaultTheses);
  const [settings, setSettings] = useState({
    price: 4,
    volume: 2,
    categories: ["Results", "Guidance", "Annual report"],
    market: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [days, setDays] = useState(0);
  const [category, setCategory] = useState("All");
  const [filingSymbol, setFilingSymbol] = useState("All");
  const [routine, setRoutine] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [portfolioQuery, setPortfolioQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [sort, setSort] = useState("name");
  const [researchSymbol, setResearchSymbol] = useState("INFY");
  const [researchInput, setResearchInput] = useState("INFY");
  const [researchTab, setResearchTab] = useState("Overview");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ResearchAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const [extract, setExtract] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [extractOpen, setExtractOpen] = useState(false);
  const [documents, setDocuments] = useState<any[] | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [documentWarning, setDocumentWarning] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    aiConfigured: boolean;
    model: string;
  } | null>(null);
  const [newThesis, setNewThesis] = useState(false);
  const [thesisSymbol, setThesisSymbol] = useState("INFY");
  const [thesisText, setThesisText] = useState("");
  const [thesisTags, setThesisTags] = useState("growth, margin");
  const answerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem("finn-v1") || "null");
      if (s) {
        setWatchlist(s.watchlist || companies.map((c) => c.symbol));
        setSaved(s.saved || []);
        setTheses(s.theses || defaultTheses);
        if (s.settings)
          setSettings({
            ...s.settings,
            price: Math.max(0.5, Number(s.settings.price) || 4),
            volume: Math.max(1, Number(s.settings.volume) || 2),
          });
      }
    } catch {}
    setLoaded(true);
    const h = location.hash.slice(1);
    if (navItems.some((n) => n.id === h)) setView(h as View);
    fetch("/api/status")
      .then((r) => r.json())
      .then((d: any) => setApiStatus(d))
      .catch(() => {});
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSelectedFiling(null);
        setSourceOpen(false);
        setNewThesis(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    if (loaded)
      localStorage.setItem(
        "finn-v1",
        JSON.stringify({ watchlist, saved, theses, settings }),
      );
  }, [watchlist, saved, theses, settings, loaded]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  const go = (v: View) => {
    setView(v);
    setMenuOpen(false);
    history.replaceState(null, "", "#" + v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openResearch = (s: string) => {
    setResearchSymbol(s);
    setResearchInput(s);
    setAnswer(null);
    setDocuments(null);
    setExtract("");
    setDocumentName("");
    setResearchTab("Overview");
    go("research");
  };
  const market = allMarkets[symbol];
  const stats = market ? marketStats(market.points) : null;
  const lastDate =
    Object.values(allMarkets)
      .map((m) => m.points.at(-1)?.date || "")
      .sort()
      .at(-1) || "";
  const marketAlerts = useMemo(
    () =>
      watchlist.flatMap((s) => {
        const m = allMarkets[s];
        if (!m) return [];
        const st = marketStats(m.points);
        const alerts = [];
        if (st.change !== null && Math.abs(st.change) >= settings.price)
          alerts.push({
            id: s + "-price",
            symbol: s,
            type: "Price move",
            text: `${changeText(st.change)} in the latest session`,
            detail: `Your threshold: ±${settings.price}%. Closing price ${money(st.last?.close)}.`,
            date: st.last!.date,
          });
        if (st.volumeRatio !== null && st.volumeRatio >= settings.volume)
          alerts.push({
            id: s + "-volume",
            symbol: s,
            type: "Volume spike",
            text: `${st.volumeRatio.toFixed(2)}× the previous 20-session average`,
            detail: `Your threshold: ${settings.volume}×. Latest volume ${volume(st.last!.volume)} shares.`,
            date: st.last!.date,
          });
        return alerts;
      }),
    [watchlist, allMarkets, settings],
  );
  const filtered = filterFilings(
    filings.filter(
      (f) =>
        watchlist.includes(f.symbol) && (!savedOnly || saved.includes(f.id)),
    ),
    {
      days,
      now: new Date().toISOString().slice(0, 10),
      category,
      symbol: filingSymbol,
      routine,
    },
  );
  const sortedFilings = [...filtered].sort(
    (a, b) =>
      ({ High: 0, Medium: 1, Routine: 2 })[a.priority] -
        { High: 0, Medium: 1, Routine: 2 }[b.priority] ||
      b.date.localeCompare(a.date),
  );
  const profile = researchProfiles[researchSymbol];
  const researchSources = evidence.filter((e) =>
    profile?.sourceIds.includes(e.id),
  );
  const portfolioCompanies = companies
    .filter(
      (c) =>
        watchlist.includes(c.symbol) &&
        (sector === "All" || c.sector === sector) &&
        (c.symbol + " " + c.name)
          .toLowerCase()
          .includes(portfolioQuery.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "move"
        ? Math.abs(
            marketStats(allMarkets[b.symbol]?.points || []).change || 0,
          ) -
          Math.abs(marketStats(allMarkets[a.symbol]?.points || []).change || 0)
        : a.name.localeCompare(b.name),
    );
  const toggleSave = (id: string) => {
    setSaved((s) => (s.includes(id) ? s.filter((v) => v !== id) : [...s, id]));
  };
  const refreshMarket = async (s: string) => {
    setRefreshing(true);
    try {
      const r = await fetch(
        "/api/market?symbol=" + encodeURIComponent(s) + "&refresh=1",
      );
      const d: any = await r.json();
      if (!r.ok) throw Error(d.error);
      setAllMarkets((m) => ({ ...m, [s]: d }));
      setToast(
        d.warning ||
          `Prices refreshed for ${s}. Latest session: ${shortDate(d.points.at(-1).date)}.`,
      );
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Could not refresh prices.");
    } finally {
      setRefreshing(false);
    }
  };
  const ask = async (q = question) => {
    if (!q.trim() || asking) return;
    setQuestion(q);
    setAsking(true);
    setAnswer(null);
    try {
      const r = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: researchSymbol,
          question: q,
          extract,
          documentName,
        }),
      });
      const d: any = await r.json();
      setAnswer(
        r.ok
          ? d
          : {
              mode: "error",
              answer: d.error || "Research unavailable.",
              citations: [],
            },
      );
      if (d.documents) setDocuments(d.documents);
    } catch {
      setAnswer({
        mode: "error",
        answer: "The connection was interrupted. Please retry.",
        citations: [],
      });
    } finally {
      setAsking(false);
      setTimeout(
        () =>
          answerRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        100,
      );
    }
  };
  const discover = async () => {
    setDiscovering(true);
    setDocumentWarning("");
    try {
      const r = await fetch(
        "/api/documents?symbol=" + encodeURIComponent(researchSymbol),
      );
      const d: any = await r.json();
      setDocuments(d.documents || []);
      setDocumentWarning(d.warning || d.error || "");
    } catch {
      setDocumentWarning(
        "Document discovery is temporarily unavailable. Paste a primary-source extract instead.",
      );
    } finally {
      setDiscovering(false);
    }
  };
  const researchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = researchInput.toUpperCase().trim().replace(/\.NS$/, "");
    if (!/^[A-Z0-9&-]{1,24}$/.test(s)) {
      setToast("Enter a valid NSE ticker, such as INFY or TCS.");
      return;
    }
    setResearchSymbol(s);
    setAnswer(null);
    setDocuments(null);
    setExtract("");
    setDocumentName("");
  };
  const exportBrief = () => {
    const text =
      `FINN | Evidence-led portfolio briefing\nExported ${new Date().toISOString()}\nMarket data through ${lastDate}. Filings below are historical examples, not a live exchange feed.\n\n` +
      sortedFilings
        .map(
          (f) =>
            `${f.symbol} | ${f.date} | ${f.priority}\n${f.title}\n${f.summary}\nWhy it matters: ${f.why}\nSource: ${evidence.find((e) => e.id === f.source)?.url}`,
        )
        .join("\n\n");
    const u = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = u;
    a.download = "finn-briefing.txt";
    a.click();
    URL.revokeObjectURL(u);
    setToast("Your briefing has been exported with source links.");
  };
  const toggleHolding = (s: string) => {
    setWatchlist((w) => (w.includes(s) ? w.filter((x) => x !== s) : [...w, s]));
  };
  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 200000) {
      setToast("Please upload a text extract under 200 KB.");
      return;
    }
    const t = await file.text();
    if (t.length > 50000) {
      setToast("Please keep the source extract under 50,000 characters.");
      return;
    }
    setExtract(t);
    setDocumentName(file.name);
    setToast("Source text added. Ask a question about this document.");
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menuOpen ? "open" : "")}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="icon-button close-mobile"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <div className="workspace-label">
          <span className="tiny-dot" />
          YOUR INVESTMENT DESK
        </div>
        <nav aria-label="Main navigation">
          {navItems.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id as View)}
              className={"nav-item " + (view === n.id ? "active" : "")}
            >
              <n.icon size={19} />
              <span>{n.label}</span>
              {n.id === "alerts" &&
                settings.market &&
                marketAlerts.length > 0 && (
                  <span className="nav-count">{marketAlerts.length}</span>
                )}
              {n.id === "theses" && (
                <span className="nav-number">{theses.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-section-label">
          ON YOUR RADAR{" "}
          <button
            className="icon-button"
            onClick={() => {
              setSearchOpen(true);
              setSearch("");
            }}
            aria-label="Add company"
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="radar-list">
          {companies
            .filter((c) => watchlist.includes(c.symbol))
            .slice(0, 5)
            .map((c) => (
              <button
                key={c.symbol}
                onClick={() => {
                  setSymbol(c.symbol);
                  go("portfolio");
                }}
              >
                <span className="radar-dot" style={{ background: c.color }} />
                {c.name}
                <ChevronRight size={13} />
              </button>
            ))}
        </div>
        <button className="all-holdings" onClick={() => go("portfolio")}>
          View all {watchlist.length} companies <ArrowRight size={13} />
        </button>
        <div className="sidebar-note">
          <span className="note-orbit">
            <Sparkles size={18} />
          </span>
          <strong>Evidence over opinion.</strong>
          <p>Every useful insight starts with a source you can inspect.</p>
          <button onClick={() => setSourceOpen(true)}>
            How FINN works <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="avatar">CG</div>
          <div>
            <strong>My research desk</strong>
            <span>Personal prototype</span>
          </div>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => go("alerts")}
          >
            <Settings2 size={17} />
          </button>
        </div>
      </aside>
      {menuOpen && (
        <div className="nav-backdrop" onClick={() => setMenuOpen(false)} />
      )}
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <button
              className="icon-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>
            <Logo small />
          </div>
          <div className="breadcrumb">
            My workspace <ChevronRight size={13} />{" "}
            <span>{navItems.find((n) => n.id === view)?.label}</span>
          </div>
          <button
            className="global-search"
            onClick={() => {
              setSearchOpen(true);
              setSearch("");
            }}
          >
            <Search size={16} />
            <span>Find a company, follow a question...</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="data-status" onClick={() => setSourceOpen(true)}>
              <span className="tiny-dot" />
              Research preview
            </button>
            <button
              className="icon-button notification-button"
              onClick={() => go("alerts")}
              aria-label="Open alerts"
            >
              <Bell size={19} />
              {settings.market && marketAlerts.length > 0 && <i />}
            </button>
            <span className="avatar top-avatar">CG</span>
          </div>
        </header>
        <main>
          {view === "briefing" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    A CLEARER VIEW OF YOUR INVESTMENTS
                  </div>
                  <h1>
                    Your portfolio, in focus<span>.</span>
                  </h1>
                  <p>
                    The moves worth understanding. The evidence behind them.
                  </p>
                </div>
                <button
                  className="button secondary export-button"
                  onClick={exportBrief}
                >
                  <Download size={15} />
                  Export briefing
                </button>
              </div>
              <div className="context-strip">
                <span>
                  <span className="tiny-dot" />
                  Market snapshot · {lastDate ? shortDate(lastDate) : "Loading"}
                </span>
                <span className="strip-separator" />
                <span>Historical filings · Apr 2025 – Apr 2026</span>
                <button onClick={() => setSourceOpen(true)}>
                  About the data <Info size={13} />
                </button>
              </div>
              <div className="summary-grid">
                <div className="summary-card">
                  <span className="summary-icon">
                    <Layers size={18} />
                  </span>
                  <div>
                    <span>Companies on your radar</span>
                    <strong>
                      {watchlist.length}
                      <small>
                        across{" "}
                        {
                          new Set(
                            companies
                              .filter((c) => watchlist.includes(c.symbol))
                              .map((c) => c.sector),
                          ).size
                        }{" "}
                        sectors
                      </small>
                    </strong>
                  </div>
                </div>
                <div className="summary-card">
                  <span className="summary-icon amber">
                    <Activity size={18} />
                  </span>
                  <div>
                    <span>Market signals</span>
                    <strong>
                      {settings.market ? marketAlerts.length : 0}
                      <small>matching your thresholds</small>
                    </strong>
                  </div>
                </div>
                <div className="summary-card">
                  <span className="summary-icon blue">
                    <FileText size={18} />
                  </span>
                  <div>
                    <span>Primary documents</span>
                    <strong>
                      {evidence.length}
                      <small>with inspectable evidence</small>
                    </strong>
                  </div>
                </div>
              </div>
              <div className="dashboard-grid">
                <section className="briefing-main">
                  <div className="section-header">
                    <div className="section-title">
                      <span className="section-dot" />
                      <h2>Worth your attention</h2>
                      <span className="count-label">
                        {sortedFilings.length}
                      </span>
                    </div>
                    <button
                      className={
                        "text-button " + (savedOnly ? "is-active" : "")
                      }
                      onClick={() => setSavedOnly(!savedOnly)}
                    >
                      <Bookmark
                        size={14}
                        fill={savedOnly ? "currentColor" : "none"}
                      />
                      {savedOnly ? "Saved items" : "Saved"}
                    </button>
                  </div>
                  <div className="filter-row">
                    <label className="select-wrap">
                      <Clock size={14} />
                      <select
                        aria-label="Filing date range"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                      >
                        <option value={0}>Historical examples</option>
                        <option value={1}>Last 24 hours</option>
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={365}>Last 12 months</option>
                      </select>
                      <ChevronDown size={13} />
                    </label>
                    <label className="select-wrap">
                      <select
                        aria-label="Announcement category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option>All</option>
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown size={13} />
                    </label>
                    <button
                      className={
                        "filter-button " + (routine ? "is-active" : "")
                      }
                      onClick={() => setRoutine(!routine)}
                    >
                      <SlidersHorizontal size={14} />
                      {routine ? "Routine included" : "Routine hidden"}
                    </button>
                  </div>
                  <div className="filing-list">
                    {sortedFilings.length === 0 ? (
                      <div className="empty-state">
                        <CheckCheck size={28} />
                        <h3>Nothing in this window.</h3>
                        <p>
                          The prototype includes dated historical filings, not a
                          continuous live exchange feed.
                        </p>
                        <button
                          className="button secondary"
                          onClick={() => {
                            setDays(0);
                            setCategory("All");
                            setSavedOnly(false);
                          }}
                        >
                          Explore historical examples
                        </button>
                      </div>
                    ) : (
                      sortedFilings.map((f, i) => (
                        <article
                          className={
                            "filing-card " + (i === 0 ? "featured" : "")
                          }
                          key={f.id}
                        >
                          <div className="filing-top">
                            <button
                              className="company-name"
                              onClick={() => openResearch(f.symbol)}
                            >
                              <CompanyMark symbol={f.symbol} />
                              <span>
                                <strong>{company(f.symbol).name}</strong>
                                <small>{f.symbol} · NSE</small>
                              </span>
                            </button>
                            <button
                              className={
                                "icon-button bookmark-button " +
                                (saved.includes(f.id) ? "is-active" : "")
                              }
                              onClick={() => toggleSave(f.id)}
                              aria-label={
                                saved.includes(f.id)
                                  ? "Unsave announcement"
                                  : "Save announcement"
                              }
                            >
                              <Bookmark
                                size={16}
                                fill={
                                  saved.includes(f.id) ? "currentColor" : "none"
                                }
                              />
                            </button>
                          </div>
                          <div className="filing-tags">
                            <Badge
                              tone={f.priority === "High" ? "amber" : "neutral"}
                            >
                              {f.priority === "High"
                                ? "Worth a closer look"
                                : "Context"}
                            </Badge>
                            <span>{f.category}</span>
                            <span>·</span>
                            <time>{shortDate(f.date)}</time>
                          </div>
                          <button
                            className="filing-title"
                            onClick={() => setSelectedFiling(f)}
                          >
                            {f.title}
                          </button>
                          <p>{f.summary}</p>
                          {i === 0 && (
                            <div className="why-box">
                              <Sparkles size={14} />
                              <div>
                                <strong>Why it matters</strong>
                                <p>{f.why}</p>
                              </div>
                            </div>
                          )}
                          <div className="filing-footer">
                            <SourceLink id={f.source} compact />
                            <button
                              className="text-button"
                              onClick={() => setSelectedFiling(f)}
                            >
                              Explore insight <ArrowRight size={14} />
                            </button>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                  <button
                    className="routine-collapse"
                    onClick={() => setRoutine(!routine)}
                  >
                    <Layers size={16} />
                    <span>
                      {routine
                        ? "Collapse routine filings"
                        : `${filings.filter((f) => f.priority === "Routine").length} routine filing tucked away`}
                    </span>
                    <ChevronDown
                      size={15}
                      style={{ transform: routine ? "rotate(180deg)" : "" }}
                    />
                  </button>
                </section>
                <aside className="right-rail">
                  <section className="insight-card">
                    <div className="eyebrow light">
                      <Target size={14} /> THE QUESTION BEHIND THE NUMBERS
                    </div>
                    <h2>
                      Did they do
                      <br />
                      what they said?
                    </h2>
                    <p>Put management’s promises next to the actual outcome.</p>
                    <div className="promise-preview">
                      <div>
                        <span>INFOSYS · FY2026 CC GROWTH</span>
                        <div className="promise-comparison">
                          <div>
                            <small>Originally guided</small>
                            <strong>
                              0–3<span>%</span>
                            </strong>
                          </div>
                          <ArrowRight size={18} />
                          <div>
                            <small>Delivered</small>
                            <strong>
                              3.1<span>%</span>
                            </strong>
                          </div>
                        </div>
                        <span className="promise-note">
                          <Check size={12} /> Above the original upper bound
                        </span>
                      </div>
                    </div>
                    <button
                      className="button cream"
                      onClick={() => {
                        openResearch("INFY");
                        setResearchTab("Promises vs. results");
                      }}
                    >
                      Follow the evidence <ArrowUpRight size={15} />
                    </button>
                    <small className="dark-note">
                      Historical comparison · sources dated Apr 2025 & Apr 2026
                    </small>
                  </section>
                  <section className="rail-card">
                    <div className="section-header">
                      <h3>Your market pulse</h3>
                      <span className="eyebrow">EOD</span>
                    </div>
                    {["INFY", "TCS", "RELIANCE", "HDFCBANK"].map((s) => {
                      const m = allMarkets[s];
                      if (!m) return null;
                      const st = marketStats(m.points);
                      return (
                        <button
                          className="pulse-row"
                          key={s}
                          onClick={() => {
                            setSymbol(s);
                            go("portfolio");
                          }}
                        >
                          <div>
                            <strong>{s}</strong>
                            <span>{money(st.last?.close)}</span>
                          </div>
                          <MiniChart
                            points={m.points}
                            positive={(st.change || 0) >= 0}
                          />
                          <strong
                            className={
                              (st.change || 0) >= 0 ? "positive" : "negative"
                            }
                          >
                            {changeText(st.change)}
                          </strong>
                        </button>
                      );
                    })}
                    <p className="micro-note">
                      Daily close change · {shortDate(lastDate)}
                      <br />
                      Real market data, saved for reliable exploration.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => go("portfolio")}
                    >
                      Open portfolio <ArrowRight size={14} />
                    </button>
                  </section>
                  <section className="rail-note">
                    <ShieldCheck size={22} />
                    <div>
                      <strong>Source first. Always.</strong>
                      <p>
                        Company disclosures power research. No broker notes or
                        outside model knowledge.
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
              <section className="panel home-chart">
                <div className="section-header">
                  <div>
                    <div className="eyebrow">PRICE, VOLUME & CONTEXT</div>
                    <h2>Every movement has a question.</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => go("portfolio")}
                  >
                    Explore charts <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="chart-company-row">
                  <button
                    className="company-name"
                    onClick={() => openResearch(symbol)}
                  >
                    <CompanyMark symbol={symbol} />
                    <span>
                      <strong>{company(symbol).name}</strong>
                      <small>{symbol} · NSE</small>
                    </span>
                  </button>
                  <label className="select-wrap">
                    <select
                      aria-label="Chart company"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    >
                      {companies
                        .filter((c) => allMarkets[c.symbol])
                        .map((c) => (
                          <option key={c.symbol} value={c.symbol}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown size={14} />
                  </label>
                </div>
                {market && (
                  <PriceChart
                    series={market}
                    range={range}
                    onRange={setRange}
                  />
                )}
                <div className="chart-caption">
                  <Info size={13} />
                  <span>
                    Price movement is an observation, not proof of what caused
                    it. Tap Research to inspect company disclosures.
                  </span>
                </div>
              </section>
            </>
          )}
          {view === "portfolio" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    WATCH THE MOVEMENT. INVESTIGATE THE REASON.
                  </div>
                  <h1>
                    Your portfolio<span>.</span>
                  </h1>
                  <p>
                    A mock watchlist of {watchlist.length} Indian companies. No
                    real holdings or transaction data.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => {
                    setSearchOpen(true);
                    setSearch("");
                  }}
                >
                  <Plus size={15} />
                  Manage companies
                </button>
              </div>
              <div className="portfolio-layout">
                <section className="panel portfolio-list">
                  <div className="list-search">
                    <Search size={16} />
                    <input
                      aria-label="Filter portfolio"
                      placeholder="Filter companies..."
                      value={portfolioQuery}
                      onChange={(e) => setPortfolioQuery(e.target.value)}
                    />
                  </div>
                  <div className="portfolio-filters">
                    <select
                      aria-label="Sector"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                    >
                      <option>All</option>
                      {[...new Set(companies.map((c) => c.sector))].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Sort portfolio"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="name">Name A–Z</option>
                      <option value="move">Largest move</option>
                    </select>
                  </div>
                  <div className="portfolio-list-head">
                    <span>COMPANY</span>
                    <span>DAY CHANGE</span>
                  </div>
                  {portfolioCompanies.map((c) => {
                    const st = marketStats(allMarkets[c.symbol]?.points || []);
                    return (
                      <button
                        className={
                          "holding-row " +
                          (symbol === c.symbol ? "selected" : "")
                        }
                        key={c.symbol}
                        onClick={() => setSymbol(c.symbol)}
                      >
                        <CompanyMark symbol={c.symbol} />
                        <span>
                          <strong>{c.name}</strong>
                          <small>
                            {c.symbol} · {c.sector}
                          </small>
                        </span>
                        <span className="holding-numbers">
                          <strong>{money(st.last?.close)}</strong>
                          <small
                            className={
                              (st.change || 0) >= 0 ? "positive" : "negative"
                            }
                          >
                            {changeText(st.change)}
                          </small>
                        </span>
                      </button>
                    );
                  })}
                  {!portfolioCompanies.length && (
                    <div className="empty-state">
                      <p>No companies match your filter.</p>
                    </div>
                  )}
                </section>
                <div className="portfolio-detail">
                  <section className="panel">
                    <div className="section-header">
                      <button
                        className="company-name"
                        onClick={() => openResearch(symbol)}
                      >
                        <CompanyMark symbol={symbol} size="large" />
                        <span>
                          <strong>{company(symbol).name}</strong>
                          <small>
                            {symbol}.NS · {company(symbol).sector}
                          </small>
                        </span>
                      </button>
                      <button
                        className="icon-button"
                        onClick={() => refreshMarket(symbol)}
                        disabled={refreshing}
                        aria-label="Refresh selected company prices"
                      >
                        <RefreshCw
                          size={17}
                          className={refreshing ? "spinning" : ""}
                        />
                      </button>
                    </div>
                    {market && (
                      <>
                        <PriceChart
                          series={market}
                          range={range}
                          onRange={setRange}
                        />
                        <div className="chart-metrics">
                          <div>
                            <span>Latest session</span>
                            <strong>
                              {shortDate(market.points.at(-1)!.date)}
                            </strong>
                          </div>
                          <div>
                            <span>Daily change</span>
                            <strong
                              className={
                                (stats?.change || 0) >= 0
                                  ? "positive"
                                  : "negative"
                              }
                            >
                              {changeText(stats?.change ?? null)}
                            </strong>
                          </div>
                          <div>
                            <span>Volume vs. 20 days</span>
                            <strong>
                              {stats?.volumeRatio?.toFixed(2) || "—"}×
                            </strong>
                          </div>
                        </div>
                        <div className="source-footer">
                          <span>
                            Source:{" "}
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={market.sourceUrl}
                            >
                              Yahoo Finance <ExternalLink size={11} />
                            </a>{" "}
                            ·{" "}
                            {market.cached === false
                              ? "Refreshed"
                              : "Saved snapshot"}{" "}
                            · EOD
                          </span>
                          <button
                            className="text-button"
                            onClick={() => refreshMarket(symbol)}
                            disabled={refreshing}
                          >
                            {refreshing ? "Refreshing..." : "Refresh data"}
                          </button>
                        </div>
                      </>
                    )}
                  </section>
                  <section className="panel chart-insights">
                    <div className="section-title">
                      <Sparkles size={17} />
                      <h2>What the chart tells us</h2>
                      <Badge tone="neutral">Calculated</Badge>
                    </div>
                    {market &&
                      stats &&
                      (() => {
                        const p = rangePoints(market.points, range),
                          movement = percentChange(p.at(-1)!.close, p[0].close);
                        return (
                          <>
                            <div className="observation">
                              <span className="observation-icon">
                                <ChartNoAxesCombined size={17} />
                              </span>
                              <div>
                                <strong>
                                  {changeText(movement)} over the selected{" "}
                                  {range.toLowerCase()}
                                </strong>
                                <p>
                                  From {money(p[0].close)} on{" "}
                                  {shortDate(p[0].date)} to{" "}
                                  {money(p.at(-1)!.close)} on{" "}
                                  {shortDate(p.at(-1)!.date)}. Price return
                                  excludes dividends.
                                </p>
                              </div>
                            </div>
                            <div className="observation">
                              <span className="observation-icon">
                                <Activity size={17} />
                              </span>
                              <div>
                                <strong>
                                  Latest volume is{" "}
                                  {stats.volumeRatio?.toFixed(2) || "—"}× its
                                  recent average
                                </strong>
                                <p>
                                  The comparison uses the previous 20 trading
                                  sessions and excludes the current session.
                                </p>
                              </div>
                            </div>
                            <div className="chart-caption">
                              <Info size={14} />
                              <span>
                                These describe historical data. Corporate
                                actions can affect unadjusted prices; no price
                                forecast or causal explanation is inferred.
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    <button
                      className="button primary"
                      onClick={() => openResearch(symbol)}
                    >
                      Research {company(symbol).name} <ArrowRight size={15} />
                    </button>
                  </section>
                </div>
              </div>
            </>
          )}
          {view === "research" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    FOLLOW A QUESTION ALL THE WAY TO THE SOURCE
                  </div>
                  <h1>
                    A closer look<span>.</span>
                  </h1>
                  <p>
                    Research a company through its own reports and management
                    commentary.
                  </p>
                </div>
                <Badge tone={apiStatus?.aiConfigured ? "green" : "neutral"}>
                  <span className="tiny-dot" />
                  {apiStatus?.aiConfigured
                    ? "AI connection configured"
                    : "Saved evidence available"}
                </Badge>
              </div>
              <form className="research-search" onSubmit={researchSubmit}>
                <Search size={20} />
                <input
                  aria-label="NSE ticker for research"
                  value={researchInput}
                  onChange={(e) => setResearchInput(e.target.value)}
                  placeholder="Enter any NSE ticker, e.g. INFY, TCS, WIPRO"
                />
                <button className="button primary" type="submit">
                  Research company <ArrowRight size={15} />
                </button>
              </form>
              <div className="suggested-companies">
                <span>START WITH</span>
                {["INFY", "TCS", "RELIANCE", "ITC"].map((s) => (
                  <button
                    className={researchSymbol === s ? "active" : ""}
                    key={s}
                    onClick={() => openResearch(s)}
                  >
                    {company(s).name}
                  </button>
                ))}
              </div>
              <section className="panel research-header">
                <div className="company-name">
                  <CompanyMark symbol={researchSymbol} size="large" />
                  <span>
                    <strong>{company(researchSymbol).name}</strong>
                    <small>
                      {researchSymbol} · {company(researchSymbol).sector}
                    </small>
                  </span>
                </div>
                <div className="research-header-right">
                  <Badge tone="neutral">
                    {profile
                      ? "Saved primary-source review"
                      : "New company research"}
                  </Badge>
                  <button
                    className="text-button"
                    onClick={() => {
                      if (
                        !watchlist.includes(researchSymbol) &&
                        companies.some((c) => c.symbol === researchSymbol)
                      ) {
                        toggleHolding(researchSymbol);
                        setToast("Company added to your watchlist.");
                      } else if (
                        !companies.some((c) => c.symbol === researchSymbol)
                      ) {
                        setToast(
                          "Research accepts any ticker. The mock portfolio currently supports the 18 selected companies.",
                        );
                      } else {
                        setSymbol(researchSymbol);
                        go("portfolio");
                      }
                    }}
                  >
                    {watchlist.includes(researchSymbol)
                      ? "View price chart"
                      : "Add to watchlist"}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </section>
              <div
                className="research-tabs"
                role="tablist"
                aria-label="Research sections"
              >
                {["Overview", "Promises vs. results", "Sources"].map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={researchTab === t}
                    className={researchTab === t ? "active" : ""}
                    onClick={() => setResearchTab(t)}
                  >
                    {t === "Overview" ? (
                      <BookOpen size={15} />
                    ) : t === "Sources" ? (
                      <FileText size={15} />
                    ) : (
                      <Target size={15} />
                    )}{" "}
                    {t}
                  </button>
                ))}
              </div>
              <div className="research-layout">
                <div className="research-main">
                  {researchTab === "Overview" &&
                    (profile ? (
                      <>
                        <section className="panel">
                          <div className="section-header">
                            <h2>The business, briefly</h2>
                            <Badge tone="neutral">Historical</Badge>
                          </div>
                          <p className="overview-copy">{profile.overview}</p>
                          <div className="research-metrics">
                            {profile.metrics.map((m) => (
                              <div key={m.label}>
                                <span>{m.label}</span>
                                <strong>{m.value}</strong>
                                <small>{m.note}</small>
                                <SourceLink id={m.source} compact />
                              </div>
                            ))}
                          </div>
                        </section>
                        <section className="case-grid">
                          <div className="case-card bull">
                            <div className="eyebrow">
                              <ArrowUpRight size={16} /> THE SUPPORTING CASE
                            </div>
                            <p>{profile.bull}</p>
                            <SourceLink
                              id={profile.sourceIds.at(-1)!}
                              compact
                            />
                          </div>
                          <div className="case-card bear">
                            <div className="eyebrow">
                              <Flag size={15} /> THE COUNTERPOINT
                            </div>
                            <p>{profile.bear}</p>
                            <SourceLink
                              id={profile.sourceIds.at(-1)!}
                              compact
                            />
                          </div>
                        </section>
                        <section className="panel management-question">
                          <span className="question-symbol">?</span>
                          <div>
                            <div className="eyebrow">
                              A QUESTION WORTH ASKING
                            </div>
                            <h3>{profile.question}</h3>
                            <p>
                              An analytical follow-up, not a statement that
                              management has answered it.
                            </p>
                          </div>
                        </section>
                      </>
                    ) : (
                      <section className="panel empty-state new-company">
                        <Search size={28} />
                        <h2>Start with the company’s evidence.</h2>
                        <p>
                          No prewritten research exists for {researchSymbol}.
                          Discover annual reports and transcripts, or supply a
                          source extract below. The same research pipeline
                          handles this ticker.
                        </p>
                        <button
                          className="button primary"
                          onClick={discover}
                          disabled={discovering}
                        >
                          {discovering ? (
                            <LoaderCircle className="spinning" size={15} />
                          ) : (
                            <FileText size={15} />
                          )}
                          Find primary documents
                        </button>
                      </section>
                    ))}
                  {researchTab === "Promises vs. results" &&
                    (researchSymbol === "INFY" ? (
                      <>
                        <section className="panel promises-panel">
                          <div className="eyebrow">
                            AN ORIGINAL PROMISE. A MATCHED OUTCOME.
                          </div>
                          <h2>Did Infosys deliver?</h2>
                          <p>
                            Compare the original FY2026 guidance with the
                            eventual full-year result. Subsequent revisions are
                            not included in this first comparison.
                          </p>
                          <div className="comparison-table">
                            <div className="comparison-head">
                              <span>MEASURE</span>
                              <span>
                                ORIGINAL GUIDANCE
                                <br />
                                <small>17 Apr 2025</small>
                              </span>
                              <span>
                                FY2026 DELIVERY
                                <br />
                                <small>23 Apr 2026</small>
                              </span>
                            </div>
                            <div className="comparison-row">
                              <strong>
                                Revenue growth
                                <small>Constant currency · full year</small>
                              </strong>
                              <div>0–3%</div>
                              <div>
                                3.1%<Badge>Above original range</Badge>
                              </div>
                            </div>
                            <div className="comparison-row">
                              <strong>
                                Operating margin
                                <small>Reported IFRS · full year</small>
                              </strong>
                              <div>20–22%</div>
                              <div>
                                20.3%<Badge>Within original range</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="comparison-sources">
                            <SourceLink id="INFY-CALL25" />
                            <SourceLink id="INFY-RESULT26" />
                          </div>
                          <div className="why-box">
                            <ShieldCheck size={18} />
                            <div>
                              <strong>What we can conclude</strong>
                              <p>
                                Revenue growth exceeded the original ceiling by
                                0.1 percentage points. Reported margin was
                                within range. This comparison does not measure
                                performance against later revised guidance.
                              </p>
                            </div>
                          </div>
                          <p className="micro-note">
                            Adjusted FY2026 operating margin was 21.0%. It is a
                            separate non-IFRS measure and is not substituted for
                            the reported margin above.
                          </p>
                        </section>
                        <section className="panel">
                          <h3>The next question</h3>
                          <p className="overview-copy">
                            What changed between the original outlook and the
                            final outcome? A complete quarterly tracker needs
                            each intervening transcript, its revisions, and
                            matched financial statements.
                          </p>
                          <button
                            className="text-button"
                            onClick={() =>
                              ask(
                                "Compare the original FY2026 revenue and operating-margin guidance with FY2026 delivery. State what is missing to assess revised guidance.",
                              )
                            }
                          >
                            Ask FINN about this comparison{" "}
                            <ArrowRight size={14} />
                          </button>
                        </section>
                      </>
                    ) : (
                      <section className="panel empty-state">
                        <Target size={30} />
                        <h2>A promise needs a matching outcome.</h2>
                        <p>
                          We haven’t verified a comparable guidance-and-delivery
                          pair for {researchSymbol}. Add the relevant
                          primary-source extracts and ask FINN to compare them.
                        </p>
                        <button
                          className="button secondary"
                          onClick={() => {
                            setExtractOpen(true);
                            setQuestion(
                              "Compare management guidance with actual delivery. Match the period and measurement basis; identify missing evidence.",
                            );
                          }}
                        >
                          Add evidence for a comparison
                        </button>
                      </section>
                    ))}
                  {researchTab === "Sources" && (
                    <section className="panel">
                      <div className="section-header">
                        <h2>The evidence library</h2>
                        <Badge tone="neutral">Primary sources</Badge>
                      </div>
                      {researchSources.map((s) => (
                        <article key={s.id} className="source-card">
                          <div className="source-card-icon">
                            <FileText size={19} />
                          </div>
                          <div>
                            <Badge tone="neutral">{s.kind}</Badge>
                            <h3>{s.title}</h3>
                            <p>{s.locator}</p>
                            <p className="source-facts">{s.facts}</p>
                            <a
                              className="text-button"
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open original document <ExternalLink size={13} />
                            </a>
                          </div>
                        </article>
                      ))}
                      {!researchSources.length && (
                        <p className="overview-copy">
                          No saved sources for this ticker. Discover documents
                          or supply an extract to begin.
                        </p>
                      )}
                      <p className="micro-note">
                        Saved fact records are curated summaries with source
                        locations, not verbatim quotations. Research coverage
                        varies by company.
                      </p>
                    </section>
                  )}
                  <section className="panel ask-panel">
                    <div className="section-header">
                      <div className="section-title">
                        <Sparkles size={19} />
                        <h2>Ask a better question.</h2>
                      </div>
                      <Badge tone="neutral">Evidence grounded</Badge>
                    </div>
                    <div className="question-chips">
                      {[
                        "What do these sources say about margins?",
                        "Where do management’s story and the numbers differ?",
                        "What evidence is missing?",
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => ask(q)}
                          disabled={asking}
                        >
                          {q}
                          <ArrowUpRight size={12} />
                        </button>
                      ))}
                    </div>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        ask();
                      }}
                      className="ask-form"
                    >
                      <textarea
                        aria-label="Question for FINN"
                        placeholder={`What would you like to understand about ${company(researchSymbol).name}?`}
                        value={question}
                        maxLength={1500}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                      <div>
                        <button
                          type="button"
                          className="text-button"
                          onClick={() => setExtractOpen(!extractOpen)}
                        >
                          <Plus size={14} />
                          {extract
                            ? "Source extract attached"
                            : "Add a source extract"}
                        </button>
                        <button
                          className="send-button"
                          type="submit"
                          disabled={asking || !question.trim()}
                          aria-label="Ask FINN"
                        >
                          {asking ? (
                            <LoaderCircle size={18} className="spinning" />
                          ) : (
                            <ArrowUpRight size={20} />
                          )}
                        </button>
                      </div>
                    </form>
                    {extractOpen && (
                      <div className="extract-box">
                        <label>
                          Document name
                          <input
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            placeholder="Annual report FY2026, pages 20–22"
                          />
                        </label>
                        <label>
                          Primary-source text
                          <textarea
                            aria-label="Primary-source extract"
                            value={extract}
                            onChange={(e) =>
                              setExtract(e.target.value.slice(0, 50000))
                            }
                            placeholder="Paste text from an annual report or earnings-call transcript. Include the period, units and page references."
                          />
                        </label>
                        <div>
                          <label className="text-button file-upload">
                            <FileText size={14} />
                            Upload .txt or .md
                            <input
                              type="file"
                              accept=".txt,.md,text/plain,text/markdown"
                              onChange={(e) => readFile(e.target.files?.[0])}
                            />
                          </label>
                          <span className="micro-note">
                            {extract.length.toLocaleString()} / 50,000
                            characters
                          </span>
                        </div>
                      </div>
                    )}
                    {asking && (
                      <div className="research-loading" role="status">
                        <LoaderCircle className="spinning" size={18} />
                        <div>
                          <strong>Following the evidence...</strong>
                          <p>
                            Checking relevant sources and keeping the answer
                            focused.
                          </p>
                        </div>
                      </div>
                    )}
                    {answer && (
                      <div
                        ref={answerRef}
                        className={
                          "research-answer " +
                          (answer.mode === "error" ? "answer-error" : "")
                        }
                      >
                        <div className="answer-label">
                          <Sparkles size={15} />
                          <strong>
                            {answer.mode === "gemini"
                              ? "FINN’s first cut"
                              : answer.mode === "error"
                                ? "Research needs attention"
                                : answer.mode === "needs-sources"
                                  ? "More evidence needed"
                                  : "What the evidence says"}
                          </strong>
                          {answer.cached && (
                            <Badge tone="neutral">Saved response</Badge>
                          )}
                        </div>
                        <div className="answer-copy">{answer.answer}</div>
                        {answer.limitations && (
                          <p className="answer-limitation">
                            <Info size={14} />
                            {answer.limitations}
                          </p>
                        )}
                        {answer.citations?.length > 0 && (
                          <div className="answer-citations">
                            {answer.citations.map((c, i) =>
                              c.url ? (
                                <a
                                  key={i}
                                  href={c.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <FileText size={13} />
                                  <span>
                                    {c.title}
                                    <small>{c.locator}</small>
                                  </span>
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <div className="uploaded-citation" key={i}>
                                  <FileText size={13} />
                                  {c.title}
                                  <span>User-provided</span>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                        {answer.notice && (
                          <p className="micro-note">{answer.notice}</p>
                        )}
                      </div>
                    )}
                    <p className="micro-note">
                      FINN uses supplied primary-source evidence. It will say
                      when a source cannot establish an answer.
                    </p>
                  </section>
                </div>
                <aside className="research-rail">
                  <section className="rail-card">
                    <div className="section-title">
                      <FileText size={17} />
                      <h3>Evidence at hand</h3>
                    </div>
                    {researchSources.map((s) => (
                      <a
                        key={s.id}
                        className="rail-source"
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className="source-type">{s.kind}</span>
                        <strong>{s.title}</strong>
                        <small>{s.locator}</small>
                        <ExternalLink size={13} />
                      </a>
                    ))}
                    {!researchSources.length && (
                      <p className="muted small-copy">
                        No saved documents for this company yet.
                      </p>
                    )}
                    <button
                      className="button secondary full-width"
                      onClick={discover}
                      disabled={discovering}
                    >
                      {discovering ? (
                        <LoaderCircle size={14} className="spinning" />
                      ) : (
                        <RefreshCw size={14} />
                      )}
                      Discover documents
                    </button>
                    {documentWarning && (
                      <p className="micro-note">{documentWarning}</p>
                    )}
                    {documents && (
                      <div className="discovered-docs">
                        {documents.length === 0 ? (
                          <p className="micro-note">
                            No documents found. Try adding a source extract.
                          </p>
                        ) : (
                          documents.map((d, i) => (
                            <a
                              key={i}
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {d.title}
                              <ExternalLink size={12} />
                            </a>
                          ))
                        )}
                      </div>
                    )}
                  </section>
                  <section className="rail-note">
                    <ShieldCheck size={24} />
                    <div>
                      <strong>Read the footnotes.</strong>
                      <p>
                        Periods, currencies and adjustments matter. FINN keeps
                        them visible instead of smoothing over differences.
                      </p>
                    </div>
                  </section>
                </aside>
              </div>
            </>
          )}
          {view === "theses" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">MAKE THE RESEARCH PERSONAL</div>
                  <h1>
                    Remember your reasons<span>.</span>
                  </h1>
                  <p>
                    Write what you’re watching. Connect it to the disclosures
                    that deserve a closer look.
                  </p>
                </div>
                <button
                  className="button primary"
                  onClick={() => setNewThesis(true)}
                >
                  <Plus size={16} />
                  Add an investment reason
                </button>
              </div>
              <div className="context-strip">
                <Info size={14} />
                <span>
                  Matches use company and keywords. They flag relevant evidence;
                  they do not decide whether your thesis is right.
                </span>
              </div>
              <div className="thesis-grid">
                {theses.map((t) => {
                  const matches = filings.filter((f) => watchMatches(t, f));
                  return (
                    <section className="panel thesis-card" key={t.id}>
                      <div className="section-header">
                        <button
                          className="company-name"
                          onClick={() => openResearch(t.symbol)}
                        >
                          <CompanyMark symbol={t.symbol} />
                          <span>
                            <strong>{company(t.symbol).name}</strong>
                            <small>{t.symbol}</small>
                          </span>
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => {
                            setTheses((s) => s.filter((v) => v.id !== t.id));
                            setToast("Investment reason removed.");
                          }}
                          aria-label="Delete investment reason"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="eyebrow">MY REASON TO WATCH</div>
                      <h2>{t.text}</h2>
                      <div className="thesis-tags">
                        {t.tags.map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="thesis-matches">
                        <div className="section-title">
                          <span className="tiny-dot" />
                          <strong>
                            {matches.length} related historical disclosure
                            {matches.length !== 1 ? "s" : ""}
                          </strong>
                        </div>
                        {matches.map((f) => (
                          <button
                            key={f.id}
                            onClick={() => setSelectedFiling(f)}
                          >
                            <span>{shortDate(f.date)}</span>
                            <strong>{f.title}</strong>
                            <ArrowUpRight size={15} />
                          </button>
                        ))}
                        {!matches.length && (
                          <p className="muted small-copy">
                            No matching disclosures in the current library. Try
                            a broader keyword.
                          </p>
                        )}
                      </div>
                    </section>
                  );
                })}
                <button
                  className="add-thesis-card"
                  onClick={() => setNewThesis(true)}
                >
                  <span>
                    <Plus size={26} />
                  </span>
                  <h3>What are you watching?</h3>
                  <p>Keep the reason beside the research.</p>
                </button>
              </div>
            </>
          )}
          {view === "alerts" && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">
                    YOU DECIDE WHAT DESERVES ATTENTION
                  </div>
                  <h1>
                    Your signal. Your rules<span>.</span>
                  </h1>
                  <p>
                    Set thresholds for this research desk. Changes are saved in
                    this browser.
                  </p>
                </div>
                <Badge tone="neutral">In-app alerts</Badge>
              </div>
              <div className="alerts-layout">
                <section className="panel alert-settings">
                  <div className="section-header">
                    <h2>When should FINN flag a move?</h2>
                    <Settings2 size={19} />
                  </div>
                  <label className="toggle-setting">
                    <span>
                      <strong>Market-move alerts</strong>
                      <small>
                        Evaluate the latest available end-of-day session.
                      </small>
                    </span>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={settings.market}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, market: e.target.checked }))
                      }
                    />
                  </label>
                  <div className="slider-setting">
                    <div>
                      <label htmlFor="price-threshold">
                        Daily price movement
                      </label>
                      <strong>±{settings.price}%</strong>
                    </div>
                    <input
                      id="price-threshold"
                      type="range"
                      min="0.5"
                      max="10"
                      step="0.5"
                      value={settings.price}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          price: Number(e.target.value),
                        }))
                      }
                    />
                    <div className="range-labels">
                      <span>0.5%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  <div className="slider-setting">
                    <div>
                      <label htmlFor="volume-threshold">
                        Volume above recent average
                      </label>
                      <strong>{settings.volume.toFixed(1)}×</strong>
                    </div>
                    <input
                      id="volume-threshold"
                      type="range"
                      min="1"
                      max="5"
                      step="0.1"
                      value={settings.volume}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          volume: Number(e.target.value),
                        }))
                      }
                    />
                    <div className="range-labels">
                      <span>1×</span>
                      <span>5×</span>
                    </div>
                    <p className="micro-note">
                      Baseline: the previous 20 sessions, excluding the latest
                      day.
                    </p>
                  </div>
                  <div className="category-settings">
                    <h3>Announcement types I care about</h3>
                    {categories.map((c) => (
                      <label key={c}>
                        <input
                          type="checkbox"
                          checked={settings.categories.includes(c)}
                          onChange={() =>
                            setSettings((s) => ({
                              ...s,
                              categories: s.categories.includes(c)
                                ? s.categories.filter((v) => v !== c)
                                : [...s.categories, c],
                            }))
                          }
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                  <div className="chart-caption">
                    <Info size={15} />
                    <span>
                      This prototype evaluates alerts when you open the app or
                      refresh data. Background polling and phone notifications
                      are not enabled.
                    </span>
                  </div>
                  <div className="settings-saved">
                    <CheckCheck size={15} />
                    Preferences saved automatically
                  </div>
                </section>
                <div>
                  <section className="panel">
                    <div className="section-header">
                      <h2>Matching market signals</h2>
                      <Badge tone="amber">
                        {settings.market ? marketAlerts.length : 0}
                      </Badge>
                    </div>
                    {settings.market && marketAlerts.length > 0 ? (
                      marketAlerts.map((a) => (
                        <button
                          className="alert-item"
                          key={a.id}
                          onClick={() => {
                            setSymbol(a.symbol);
                            go("portfolio");
                          }}
                        >
                          <span className="alert-item-icon">
                            <Activity size={18} />
                          </span>
                          <span>
                            <strong>
                              {a.symbol} · {a.type}
                            </strong>
                            <b>{a.text}</b>
                            <small>{a.detail}</small>
                            <small>{shortDate(a.date)} · EOD</small>
                          </span>
                          <ChevronRight size={16} />
                        </button>
                      ))
                    ) : (
                      <div className="empty-state">
                        <CheckCheck size={26} />
                        <h3>
                          {settings.market
                            ? "A quiet session."
                            : "Market alerts are paused."}
                        </h3>
                        <p>
                          {settings.market
                            ? "No holdings cross your current thresholds. Adjust the settings to explore different signals."
                            : "Turn on market alerts to evaluate your holdings."}
                        </p>
                      </div>
                    )}
                  </section>
                  <section className="panel announcement-alerts">
                    <div className="section-header">
                      <h2>Selected announcement examples</h2>
                      <Badge tone="neutral">Historical</Badge>
                    </div>
                    {filings
                      .filter(
                        (f) =>
                          watchlist.includes(f.symbol) &&
                          settings.categories.includes(f.category) &&
                          f.priority !== "Routine",
                      )
                      .map((f) => (
                        <button key={f.id} onClick={() => setSelectedFiling(f)}>
                          <Badge tone="neutral">{f.symbol}</Badge>
                          <span>
                            {f.title}
                            <small>
                              {shortDate(f.date)} · {f.category}
                            </small>
                          </span>
                          <ArrowUpRight size={15} />
                        </button>
                      ))}
                    {!filings.some(
                      (f) =>
                        watchlist.includes(f.symbol) &&
                        settings.categories.includes(f.category) &&
                        f.priority !== "Routine",
                    ) && (
                      <p className="muted">
                        No examples match your selected categories.
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}
          <footer className="page-footer">
            <Logo small />
            <span>Built for a clearer investment day.</span>
            <button onClick={() => setSourceOpen(true)}>
              Data & methodology <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((n) => (
          <button
            key={n.id}
            className={view === n.id ? "active" : ""}
            onClick={() => go(n.id as View)}
          >
            <n.icon size={20} />
            <span>{n.label === "Thesis watch" ? "Theses" : n.label}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {searchOpen && (
        <div className="modal-backdrop" onClick={() => setSearchOpen(false)}>
          <section
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Search companies"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-modal-input">
              <Search size={21} />
              <input
                autoFocus
                placeholder="Company name or NSE ticker..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="icon-button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
              >
                <X size={18} />
              </button>
            </div>
            <div className="search-modal-results">
              <div className="eyebrow">FIND YOUR NEXT QUESTION</div>
              {companies
                .filter((c) =>
                  (c.name + " " + c.symbol)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((c) => (
                  <div className="search-company" key={c.symbol}>
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        openResearch(c.symbol);
                      }}
                    >
                      <CompanyMark symbol={c.symbol} />
                      <span>
                        <strong>{c.name}</strong>
                        <small>
                          {c.symbol} · {c.sector}
                        </small>
                      </span>
                      <ArrowUpRight size={15} />
                    </button>
                    <button
                      className={
                        "watch-toggle " +
                        (watchlist.includes(c.symbol) ? "watching" : "")
                      }
                      onClick={() => toggleHolding(c.symbol)}
                      aria-label={
                        watchlist.includes(c.symbol)
                          ? "Remove " + c.name + " from watchlist"
                          : "Add " + c.name + " to watchlist"
                      }
                    >
                      {watchlist.includes(c.symbol) ? (
                        <Check size={15} />
                      ) : (
                        <Plus size={15} />
                      )}
                    </button>
                  </div>
                ))}
              {search.trim() &&
                /^[A-Z0-9&.-]{1,24}$/i.test(search.trim()) &&
                !companies.some(
                  (c) => c.symbol === search.trim().toUpperCase(),
                ) && (
                  <button
                    className="new-ticker-button"
                    onClick={() => {
                      setSearchOpen(false);
                      openResearch(
                        search.trim().toUpperCase().replace(/\.NS$/, ""),
                      );
                    }}
                  >
                    <Search size={17} />
                    Research {search.toUpperCase()} using primary documents
                    <ArrowRight size={15} />
                  </button>
                )}
            </div>
            <div className="search-modal-footer">
              <span>
                <Check size={12} /> On your radar
              </span>
              <span>Any NSE ticker can be researched</span>
            </div>
          </section>
        </div>
      )}
      {selectedFiling && (
        <div className="modal-backdrop" onClick={() => setSelectedFiling(null)}>
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Announcement insight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-header">
              <Badge tone="neutral">Historical disclosure</Badge>
              <button
                className="icon-button"
                onClick={() => setSelectedFiling(null)}
                aria-label="Close announcement"
              >
                <X size={20} />
              </button>
            </div>
            <div className="company-name">
              <CompanyMark symbol={selectedFiling.symbol} />
              <span>
                <strong>{company(selectedFiling.symbol).name}</strong>
                <small>
                  {shortDate(selectedFiling.date)} · {selectedFiling.category}
                </small>
              </span>
            </div>
            <h2>{selectedFiling.title}</h2>
            <p className="overview-copy">{selectedFiling.summary}</p>
            <div className="why-box">
              <Sparkles size={18} />
              <div>
                <strong>Why it deserves attention</strong>
                <p>{selectedFiling.why}</p>
              </div>
            </div>
            {selectedFiling.symbol === "INFY" &&
              selectedFiling.category === "Results" && (
                <>
                  <h3 className="modal-subheading">
                    Headline numbers, without the noise
                  </h3>
                  <p className="micro-note">
                    Consolidated IFRS · USD million · quarter ended 31 Mar 2026
                  </p>
                  <div className="results-table">
                    <div>
                      <span>MEASURE</span>
                      <span>Q4 FY26</span>
                      <span>QoQ</span>
                      <span>YoY</span>
                    </div>
                    {[
                      { name: "Revenue", now: 5040, prev: 5099, year: 4730 },
                      { name: "EBIT", now: 1055, prev: 937, year: 992 },
                      { name: "PBT", now: 1168, prev: 1035, year: 1117 },
                      { name: "PAT¹", now: 919, prev: 747, year: 813 },
                    ].map((r) => (
                      <div key={r.name}>
                        <strong>{r.name}</strong>
                        <span>{r.now.toLocaleString()}</span>
                        <span>{changeText(percentChange(r.now, r.prev))}</span>
                        <span>{changeText(percentChange(r.now, r.year))}</span>
                      </div>
                    ))}
                  </div>
                  <p className="micro-note">
                    ¹ Net profit after non-controlling interests. EBITDA is not
                    established in this saved extract; EBIT is shown with its
                    own label.
                  </p>
                  <SourceLink id="INFY-FACT26" />
                </>
              )}
            <h3 className="modal-subheading">The evidence</h3>
            <SourceLink id={selectedFiling.source} />
            <p className="micro-note">
              {evidence.find((e) => e.id === selectedFiling.source)?.locator}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => toggleSave(selectedFiling.id)}
              >
                <Bookmark size={15} />
                {saved.includes(selectedFiling.id) ? "Saved" : "Save insight"}
              </button>
              <button
                className="button primary"
                onClick={() => {
                  openResearch(selectedFiling.symbol);
                  setSelectedFiling(null);
                }}
              >
                Research company <ArrowRight size={15} />
              </button>
            </div>
          </section>
        </div>
      )}
      {sourceOpen && (
        <div className="modal-backdrop" onClick={() => setSourceOpen(false)}>
          <section
            className="detail-modal methodology"
            role="dialog"
            aria-modal="true"
            aria-label="Data and methodology"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="section-header">
              <Logo small />
              <button
                className="icon-button"
                onClick={() => setSourceOpen(false)}
                aria-label="Close methodology"
              >
                <X size={20} />
              </button>
            </div>
            <h2>A clear view includes the limits.</h2>
            <p className="overview-copy">
              FINN is a working research prototype. Here’s what powers it today.
            </p>
            <div className="method-item">
              <ChartNoAxesCombined size={21} />
              <div>
                <h3>Real price history, dated clearly</h3>
                <p>
                  18 NSE companies, approximately one year of daily prices and
                  volume from Yahoo Finance. The saved snapshot ends{" "}
                  {shortDate(lastDate)}. On-demand refresh requests the provider
                  again. Charts show unadjusted closing prices, so splits and
                  other corporate actions can affect comparisons.
                </p>
              </div>
            </div>
            <div className="method-item">
              <FileText size={21} />
              <div>
                <h3>Historical filings, not a live exchange feed</h3>
                <p>
                  The briefing contains selected real company disclosures from
                  Apr 2025 to Apr 2026. Source dates are preserved. Continuous
                  NSE/BSE ingestion is still to be built; recent-window filters
                  may therefore be empty.
                </p>
              </div>
            </div>
            <div className="method-item">
              <Sparkles size={21} />
              <div>
                <h3>Evidence-grounded AI</h3>
                <p>
                  Saved reviews cover four companies. Questions use Gemini when
                  available, limited to supplied source records or discovered
                  primary documents. Unknown tickers use the same discovery
                  pipeline or a source extract you provide. Source checking
                  verifies citation IDs; it does not guarantee every
                  interpretation is correct.
                </p>
              </div>
            </div>
            <div className="method-item">
              <Target size={21} />
              <div>
                <h3>Your preferences stay in this browser</h3>
                <p>
                  Watchlists, saved insights, thesis notes and alert settings
                  use local browser storage. There is no account sync. Alerts
                  evaluate in-app; background monitoring and phone notifications
                  are not enabled.
                </p>
              </div>
            </div>
            <div className="method-item">
              <ShieldCheck size={21} />
              <div>
                <h3>A research aid, not a forecast</h3>
                <p>
                  Price observations do not prove causation. Guidance
                  comparisons match periods and measurement basis. Missing
                  evidence stays missing.
                </p>
              </div>
            </div>
            <button
              className="button primary full-width"
              onClick={() => setSourceOpen(false)}
            >
              Back to my desk <ArrowRight size={15} />
            </button>
          </section>
        </div>
      )}
      {newThesis && (
        <div className="modal-backdrop" onClick={() => setNewThesis(false)}>
          <form
            className="detail-modal thesis-form"
            role="dialog"
            aria-modal="true"
            aria-label="Add investment reason"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (!thesisText.trim()) return;
              const tags = thesisTags
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);
              if (!tags.length) {
                setToast("Add at least one watch keyword.");
                return;
              }
              setTheses((s) => [
                ...s,
                {
                  id: crypto.randomUUID(),
                  symbol: thesisSymbol,
                  text: thesisText.trim(),
                  tags,
                },
              ]);
              setThesisText("");
              setNewThesis(false);
              setToast(
                "Investment reason saved. Related historical disclosures are linked below.",
              );
            }}
          >
            <div className="section-header">
              <div className="eyebrow">A REASON TO KEEP WATCHING</div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setNewThesis(false)}
                aria-label="Close investment reason"
              >
                <X size={20} />
              </button>
            </div>
            <h2>What matters to you?</h2>
            <label>
              Company
              <select
                value={thesisSymbol}
                onChange={(e) => setThesisSymbol(e.target.value)}
              >
                {companies.map((c) => (
                  <option value={c.symbol} key={c.symbol}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your investment reason
              <textarea
                required
                value={thesisText}
                maxLength={400}
                onChange={(e) => setThesisText(e.target.value)}
                placeholder="I’m watching whether debt falls while the new business grows..."
              />
            </label>
            <label>
              Watch keywords, separated by commas
              <input
                required
                value={thesisTags}
                onChange={(e) => setThesisTags(e.target.value)}
                placeholder="debt, cash, growth"
              />
            </label>
            <p className="micro-note">
              FINN matches these words within disclosures for this company.
              Matching evidence may support or challenge your reason.
            </p>
            <button className="button primary full-width" type="submit">
              <Check size={16} />
              Save investment reason
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
