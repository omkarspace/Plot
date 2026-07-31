"use client";

import { useState, useEffect } from "react";

interface KBStatus {
  seeded: boolean;
  totalChunks: number;
  totalEmbeddings: number;
  totalShows: number;
  cacheSize: number;
  shows: { id: number; title: string; type: string; posterPath: string | null }[];
}

export default function KnowledgeBase() {
  const [status, setStatus] = useState<KBStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isEmbeddingWatchlist, setIsEmbeddingWatchlist] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [embedResult, setEmbedResult] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/rag/status");
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch { /* ignored */ }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const refreshStatus = () => {
    fetch("/api/rag/status").then(r => r.json()).then(setStatus).catch(() => {});
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await fetch("/api/rag/seed", { method: "POST" });
      const data = await res.json();
      setSeedResult(`Seeded ${data.seeded} shows (${data.skipped} cached)`);
      refreshStatus();
    } catch {
      setSeedResult("Failed to seed knowledge base");
    } finally {
      setIsSeeding(false);
    }
  };

  const handleEmbedWatchlist = async () => {
    setIsEmbeddingWatchlist(true);
    setEmbedResult(null);
    try {
      const res = await fetch("/api/rag/embed-watchlist", { method: "POST" });
      const data = await res.json();
      if (data.message) {
        setEmbedResult(data.message);
      } else {
        setEmbedResult(`Embedded ${data.seeded} watchlist items (${data.skipped} already in KB)`);
      }
      refreshStatus();
    } catch {
      setEmbedResult("Failed to embed watchlist");
    } finally {
      setIsEmbeddingWatchlist(false);
    }
  };

  return (
    <div className="border border-ruled bg-flap-black">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-flap-shadow transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-[2px]">
            {"DATA".split("").map((char, i) => (
              <span key={i} className="flap-char text-xs w-5 h-6">{char}</span>
            ))}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-flap-white text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
              Knowledge Base
            </h3>
            <p className="text-steel-dark text-[10px] font-[family-name:var(--font-mono)]">
              {status ? `${status.totalShows} shows, ${status.totalChunks} vectors` : "Not loaded"}
            </p>
          </div>
        </div>
        <span className={`text-steel-dark text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>
          →
        </span>
      </button>

      {isExpanded && status && (
        <div className="border-t border-ruled p-4 space-y-4">
          {/* Stats — ruled grid */}
          <div className="grid grid-cols-3 gap-0 border border-ruled">
            <div className="px-3 py-3 border-r border-ruled">
              <span className="text-[9px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block">
                Status
              </span>
              <span className={`text-sm font-bold font-[family-name:var(--font-mono)] block mt-1 ${status.seeded ? "text-delay-amber" : "text-steel-dark"}`}>
                {status.seeded ? "ACTIVE" : "EMPTY"}
              </span>
            </div>
            <div className="px-3 py-3 border-r border-ruled">
              <span className="text-[9px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block">
                Shows
              </span>
              <span className="text-sm font-bold text-flap-white font-[family-name:var(--font-mono)] block mt-1">
                {status.totalShows}
              </span>
            </div>
            <div className="px-3 py-3">
              <span className="text-[9px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block">
                Vectors
              </span>
              <span className="text-sm font-bold text-flap-white font-[family-name:var(--font-mono)] block mt-1">
                {status.totalChunks}
              </span>
            </div>
          </div>

          {/* Embedded Shows */}
          {status.shows.length > 0 && (
            <div>
              <span className="text-[9px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block mb-2">
                Embedded Shows
              </span>
              <div className="flex flex-wrap gap-0 border border-ruled">
                {status.shows.map((show) => (
                  <span
                    key={show.id}
                    className="text-[10px] uppercase tracking-wider bg-flap-shadow text-steel-frame px-3 py-1.5 border-r border-ruled last:border-r-0 font-[family-name:var(--font-board)]"
                  >
                    {show.title}
                    <span className="text-steel-dark ml-1">({show.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-0">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex-1 px-4 py-3 bg-delay-amber text-flap-black text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold hover:bg-delay-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-r border-flap-black"
            >
              {isSeeding ? "Seeding..." : "Seed Demo Data"}
            </button>
            <button
              onClick={handleEmbedWatchlist}
              disabled={isEmbeddingWatchlist}
              className="flex-1 px-4 py-3 border border-delay-amber text-delay-amber text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold hover:bg-delay-amber/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEmbeddingWatchlist ? "Embedding..." : "Embed Watchlist"}
            </button>
          </div>

          <button
            onClick={refreshStatus}
            className="w-full px-4 py-2 border border-ruled text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)] hover:text-flap-white hover:border-steel-dark transition-colors"
          >
            Refresh Status
          </button>

          {seedResult && (
            <p className="text-[10px] text-steel-dark text-center font-[family-name:var(--font-mono)]">{seedResult}</p>
          )}
          {embedResult && (
            <p className="text-[10px] text-delay-amber text-center font-[family-name:var(--font-mono)]">{embedResult}</p>
          )}
        </div>
      )}
    </div>
  );
}
