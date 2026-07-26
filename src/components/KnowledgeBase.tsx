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
    <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#141414] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#10b981]/20 flex items-center justify-center">
            <span className="text-[#10b981] text-sm font-bold">KB</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">Knowledge Base</h3>
            <p className="text-[#737373] text-xs">
              {status ? `${status.totalShows} shows, ${status.totalChunks} chunks` : "Not loaded"}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[#737373] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && status && (
        <div className="border-t border-[#262626] p-4 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#141414] rounded-lg p-3">
              <p className="text-[#737373] text-[10px] uppercase tracking-wider">Status</p>
              <p className={`text-sm font-semibold mt-0.5 ${status.seeded ? "text-[#10b981]" : "text-[#eab308]"}`}>
                {status.seeded ? "Active" : "Empty"}
              </p>
            </div>
            <div className="bg-[#141414] rounded-lg p-3">
              <p className="text-[#737373] text-[10px] uppercase tracking-wider">Shows</p>
              <p className="text-sm font-semibold text-white mt-0.5">{status.totalShows}</p>
            </div>
            <div className="bg-[#141414] rounded-lg p-3">
              <p className="text-[#737373] text-[10px] uppercase tracking-wider">Vectors</p>
              <p className="text-sm font-semibold text-white mt-0.5">{status.totalChunks}</p>
            </div>
          </div>

          {status.shows.length > 0 && (
            <div>
              <p className="text-[#737373] text-[10px] uppercase tracking-wider mb-2">Embedded Shows</p>
              <div className="flex flex-wrap gap-1">
                {status.shows.map((show) => (
                  <span
                    key={show.id}
                    className="text-[11px] bg-[#141414] text-[#a3a3a3] px-2 py-1 rounded-md border border-[#262626]"
                  >
                    {show.title}
                    <span className="text-[#525252] ml-1">({show.type})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex-1 px-4 py-2.5 bg-[#10b981] text-white text-sm font-medium rounded-xl hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSeeding ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Seeding...
                </span>
              ) : (
                "Seed Demo Data"
              )}
            </button>
            <button
              onClick={handleEmbedWatchlist}
              disabled={isEmbeddingWatchlist}
              className="flex-1 px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEmbeddingWatchlist ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Embedding...
                </span>
              ) : (
                "Embed My Watchlist"
              )}
            </button>
          </div>

          <button
            onClick={refreshStatus}
            className="w-full px-4 py-2 border border-[#262626] text-[#a3a3a3] text-sm rounded-xl hover:border-[#404040] transition-colors"
          >
            Refresh Status
          </button>

          {seedResult && (
            <p className="text-xs text-[#737373] text-center">{seedResult}</p>
          )}
          {embedResult && (
            <p className="text-xs text-[#3b82f6] text-center">{embedResult}</p>
          )}
        </div>
      )}
    </div>
  );
}
