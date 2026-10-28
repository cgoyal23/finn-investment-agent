"use client";
import { useEffect, useState } from "react";
import { Search, ArrowUpRight, LoaderCircle } from "lucide-react";
import type { CompanyIdentity } from "@/lib/company-directory";
export function CompanyLookup({
  onSelect,
  query,
  onQuery,
  compact = false,
}: {
  onSelect: (company: CompanyIdentity) => void;
  query?: string;
  onQuery?: (query: string) => void;
  compact?: boolean;
}) {
  const [input, setInput] = useState("");
  const value = query ?? input;
  const [response, setResponse] = useState<{
    query: string;
    results: CompanyIdentity[];
    warning: string;
  } | null>(null);
  const hasQuery = value.trim().length >= 2;
  const current = hasQuery && response?.query === value ? response : null;
  const results = current?.results || [];
  const warning = current?.warning || "";
  const busy = hasQuery && !current;
  useEffect(() => {
    if (value.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const r = await fetch(
          "/api/companies?q=" + encodeURIComponent(value.trim()),
          {
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10000),
            ]),
          },
        );
        const d = (await r.json()) as {
          results?: CompanyIdentity[];
          error?: string;
          warning?: string;
        };
        if (!r.ok) throw Error(d.error);
        if (!controller.signal.aborted) {
          setResponse({
            query: value,
            results: d.results || [],
            warning: d.warning || "",
          });
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setResponse({
            query: value,
            results: [],
            warning:
              e instanceof Error
                ? e.message
                : "Company search is unavailable. Please retry.",
          });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value]);
  return (
    <div className={"company-lookup " + (compact ? "compact" : "")}>
      {!compact && (
        <div className="company-lookup-input">
          <Search size={19} />
          <input
            aria-label="Find a company by name or ticker"
            value={value}
            onChange={(e) => {
              onQuery?.(e.target.value);
              setInput(e.target.value);
            }}
            placeholder="Search a company: Samsung, Infosys, Apple…"
          />
          <span>Name or ticker</span>
        </div>
      )}
      <div role="status" className="lookup-status">
        {busy ? (
          <>
            <LoaderCircle className="spinning" size={13} />
            Finding matching companies…
          </>
        ) : (
          warning
        )}
      </div>
      {results.length > 0 && (
        <div
          className="company-lookup-results"
          aria-label="Matching listed companies"
        >
          {results.map((c) => (
            <button
              key={c.symbol}
              onClick={() => {
                onSelect(c);
                onQuery?.("");
                setInput("");
                setResponse(null);
              }}
            >
              <span className="lookup-initial">{c.name[0]}</span>
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.symbol} · {c.exchange}
                </small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      )}
      {!busy && value.trim().length >= 2 && !results.length && !warning && (
        <p className="lookup-status">
          No matching listed company found. Try its full name or ticker. Private
          companies may not have a share-price chart.
        </p>
      )}
    </div>
  );
}
