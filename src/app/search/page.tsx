/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { searchShows, buildShowDetailById, getImageUrl } from "@/lib/tmdb";
import { isInWatchlist, addToWatchlist, isWatched } from "@/lib/localStorage";
import type { TMDBSearchResult } from "@/types";
import type { SearchResult } from "@/types/rag";

type SearchMode = "semantic" | "tmdb";

interface AggregatedResult {
  title: string;
  showId: number;
  type: "tv" | "movie";
  posterPath: string | null;
  bestScore: number;
  chunks: { content: string; score: number; field: string }[];
}

interface SemanticHistoryItem {
  query: string;
  timestamp: number;
}

const POPULAR_SEARCHES = [
  "dark and twisty thriller",
  "feel-good comedy",
  "sci-fi with plot twists",
  "something like Breaking Bad",
  "hidden gems with high ratings",
  "quick movie under 2 hours",
];

const SEMANTIC_HISTORY_KEY = "plot-semantic-history";

function getSemanticHistory(): SemanticHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(SEMANTIC_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSemanticHistory(query: string) {
  const history = getSemanticHistory().filter((h) => h.query !== query);
  history.unshift({ query, timestamp: Date.now() });
  if (history.length > 8) history.pop();
  localStorage.setItem(SEMANTIC_HISTORY_KEY, JSON.stringify(history));
}

function getScoreColor(score: number): string {
  if (score >= 0.6) return "bg-[#10b981]";
  if (score >= 0.4) return "bg-[#3b82f6]";
  if (score >= 0.25) return "bg-[#eab308]";
  return "bg-[#737373]";
}

function getScoreLabel(score: number): string {
  if (score >= 0.6) return "Excellent match";
  if (score >= 0.4) return "Good match";
  if (score >= 0.25) return "Partial match";
  return "Weak match";
}

export default function SearchPage() {
  const [mode, setMode] = useState<SearchMode>("semantic");
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Semantic search state
  const [semanticResults, setSemanticResults] = useState<SearchResult[]>([]);
  const [aggregatedResults, setAggregatedResults] = useState<AggregatedResult[]>([]);
  const [semanticHistory, setSemanticHistory] = useState<SemanticHistoryItem[]>([]);
  const [kbStatus, setKbStatus] = useState<{ seeded: boolean; totalShows: number } | null>(null);

  // TMDB search state
  const [tmdbResults, setTmdbResults] = useState<TMDBSearchResult[]>([]);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSemanticHistory(getSemanticHistory());
    fetch("/api/rag/status")
      .then((r) => r.json())
      .then((d) => setKbStatus({ seeded: d.seeded, totalShows: d.totalShows }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const aggregateResults = (results: SearchResult[]): AggregatedResult[] => {
    const map = new Map<number, AggregatedResult>();
    for (const r of results) {
      const existing = map.get(r.chunk.metadata.showId);
      if (existing) {
        existing.chunks.push({ content: r.chunk.content, score: r.score, field: r.chunk.metadata.field });
        if (r.score > existing.bestScore) existing.bestScore = r.score;
      } else {
        map.set(r.chunk.metadata.showId, {
          title: r.chunk.metadata.title,
          showId: r.chunk.metadata.showId,
          type: r.chunk.metadata.type,
          posterPath: r.chunk.metadata.posterPath,
          bestScore: r.score,
          chunks: [{ content: r.chunk.content, score: r.score, field: r.chunk.metadata.field }],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.bestScore - a.bestScore);
  };

  const handleSemanticSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setSearched(true);
    saveSemanticHistory(searchQuery);
    setSemanticHistory(getSemanticHistory());

    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), topK: 15 }),
      });
      const data = await res.json();
      const results = data.results || [];
      setSemanticResults(results);
      setAggregatedResults(aggregateResults(results));
    } catch {
      setSemanticResults([]);
      setAggregatedResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTMDBSearch = (searchQuery: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (searchQuery.trim().length < 2) {
      setTmdbResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setSearched(true);
      try {
        const data = await searchShows(searchQuery);
        setTmdbResults(
          data.results
            .filter((r) => r.media_type === "tv" || r.media_type === "movie")
            .slice(0, 12)
        );
      } catch {
        setTmdbResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);
    debounceTimerRef.current = timer;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (mode === "semantic") handleSemanticSearch(query);
      else handleTMDBSearch(query);
    }
  };

  const handleSelectResult = async (id: number, type: "tv" | "movie") => {
    try {
      const detail = await buildShowDetailById(id, type);
      window.dispatchEvent(
        new CustomEvent("plot:navigate", { detail: { type: "showDetail", show: detail } })
      );
    } catch {
      // Detail load failed
    }
  };

  const handleAddToWatchlist = (result: AggregatedResult) => {
    if (isInWatchlist(result.showId)) return;
    addToWatchlist({
      id: result.showId,
      type: result.type,
      title: result.title,
      posterPath: result.posterPath,
      totalRuntimeMinutes: 0,
      addedAt: Date.now(),
    });
  };

  const handleModeChange = (newMode: SearchMode) => {
    setMode(newMode);
    setQuery("");
    setSearched(false);
    setSemanticResults([]);
    setAggregatedResults([]);
    setTmdbResults([]);
  };

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Search</h1>
          <p className="text-[#737373]">
            Find shows using natural language or search TMDB directly
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-[#141414] border border-[#262626] rounded-xl p-1">
            <button
              onClick={() => handleModeChange("semantic")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "semantic"
                  ? "bg-[#3b82f6] text-white"
                  : "text-[#737373] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Semantic
              </span>
            </button>
            <button
              onClick={() => handleModeChange("tmdb")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "tmdb"
                  ? "bg-[#3b82f6] text-white"
                  : "text-[#737373] hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                TMDB
              </span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (mode === "tmdb") handleTMDBSearch(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "semantic"
                  ? "Describe what you're in the mood for..."
                  : "Search for a TV show or movie..."
              }
              className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#525252] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
            />
            {mode === "semantic" && (
              <button
                onClick={() => handleSemanticSearch(query)}
                disabled={!query.trim() || isLoading}
                className="px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            )}
            {mode === "tmdb" && isLoading && (
              <div className="flex items-center px-4">
                <div className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* KB Status Badge */}
          {mode === "semantic" && kbStatus && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  kbStatus.seeded ? "bg-[#10b981]" : "bg-[#eab308]"
                }`}
              />
              <span className="text-xs text-[#737373]">
                {kbStatus.seeded
                  ? `${kbStatus.totalShows} shows in knowledge base`
                  : "Knowledge base empty — seed it first"}
              </span>
              {!kbStatus.seeded && (
                <Link
                  href="/"
                  className="text-xs text-[#3b82f6] hover:underline"
                >
                  Go seed
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Semantic Mode: Suggestions / History */}
        {mode === "semantic" && !searched && (
          <div className="space-y-6">
            {semanticHistory.length > 0 && (
              <div>
                <p className="text-[#737373] text-xs uppercase tracking-wider mb-3">
                  Recent Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {semanticHistory.map((item) => (
                    <button
                      key={item.query}
                      onClick={() => {
                        setQuery(item.query);
                        handleSemanticSearch(item.query);
                      }}
                      className="px-3 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-sm text-[#a3a3a3] hover:border-[#3b82f6]/50 hover:text-[#3b82f6] transition-colors"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[#737373] text-xs uppercase tracking-wider mb-3">
                Try Searching
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {POPULAR_SEARCHES.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      handleSemanticSearch(suggestion);
                    }}
                    className="px-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-left text-sm text-[#a3a3a3] hover:border-[#3b82f6]/50 hover:text-white transition-colors"
                  >
                    <span className="text-[#3b82f6] mr-2">→</span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TMDB Mode: Empty State */}
        {mode === "tmdb" && !searched && (
          <div className="text-center py-16">
            <p className="text-[#525252] text-sm">
              Start typing to search TMDB&apos;s catalog of movies and TV shows
            </p>
          </div>
        )}

        {/* No Results */}
        {searched && !isLoading && mode === "semantic" && aggregatedResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#737373] text-lg mb-2">No matches found</p>
            <p className="text-[#525252] text-sm">
              Try rephrasing your query or seed more content into the knowledge base
            </p>
          </div>
        )}

        {searched && !isLoading && mode === "tmdb" && tmdbResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#737373] text-lg mb-2">No results found</p>
            <p className="text-[#525252] text-sm">
              Try a different search term
            </p>
          </div>
        )}

        {/* Semantic Results */}
        {mode === "semantic" && aggregatedResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#737373] text-sm">
                {aggregatedResults.length} show{aggregatedResults.length !== 1 ? "s" : ""} matched
                <span className="text-[#525252] ml-1">
                  ({semanticResults.length} chunks analyzed)
                </span>
              </p>
            </div>

            <div className="space-y-3">
              {aggregatedResults.map((result) => (
                <div
                  key={result.showId}
                  className="border border-[#262626] rounded-xl bg-[#0a0a0a] hover:border-[#404040] transition-all overflow-hidden"
                >
                  <div className="flex items-stretch">
                    {/* Poster */}
                    <button
                      onClick={() => handleSelectResult(result.showId, result.type)}
                      className="flex-shrink-0 w-20 md:w-24 relative"
                    >
                      <Image
                        src={getImageUrl(result.posterPath, "w185")}
                        alt={result.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 80px, 96px"
                      />
                    </button>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <button
                              onClick={() => handleSelectResult(result.showId, result.type)}
                              className="font-semibold text-white hover:text-[#3b82f6] transition-colors truncate"
                            >
                              {result.title}
                            </button>
                            <span className="text-xs bg-[#1a1a1a] text-[#a3a3a3] px-2 py-0.5 rounded flex-shrink-0">
                              {result.type === "tv" ? "TV" : "Movie"}
                            </span>
                          </div>

                          {/* Best matching chunk */}
                          <p className="text-[#737373] text-sm line-clamp-2 mb-2">
                            {result.chunks[0]?.content || ""}
                          </p>

                          {/* Match sources */}
                          {result.chunks.length > 1 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {result.chunks.map((chunk, ci) => (
                                <span
                                  key={ci}
                                  className="text-[10px] bg-[#141414] text-[#525252] px-1.5 py-0.5 rounded"
                                >
                                  {chunk.field}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-lg font-bold ${
                            result.bestScore >= 0.6
                              ? "text-[#10b981]"
                              : result.bestScore >= 0.4
                              ? "text-[#3b82f6]"
                              : result.bestScore >= 0.25
                              ? "text-[#eab308]"
                              : "text-[#737373]"
                          }`}>
                            {(result.bestScore * 100).toFixed(0)}%
                          </div>
                          <p className="text-[10px] text-[#525252]">{getScoreLabel(result.bestScore)}</p>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mt-2 mb-3">
                        <div className="h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getScoreColor(result.bestScore)}`}
                            style={{ width: `${Math.min(result.bestScore * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectResult(result.showId, result.type)}
                          className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded-lg text-xs text-[#a3a3a3] hover:border-[#3b82f6]/50 hover:text-white transition-colors"
                        >
                          View Details
                        </button>
                        {isInWatchlist(result.showId) ? (
                          <span className="px-3 py-1.5 bg-[#3b82f6]/20 text-[#3b82f6] rounded-lg text-xs font-medium">
                            In Watchlist
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToWatchlist(result)}
                            className="px-3 py-1.5 bg-[#3b82f6] text-white rounded-lg text-xs font-medium hover:bg-[#2563eb] transition-colors"
                          >
                            + Add to Watchlist
                          </button>
                        )}
                        {isWatched(result.showId) && (
                          <span className="px-3 py-1.5 bg-[#10b981]/20 text-[#10b981] rounded-lg text-xs font-medium">
                            ✓ Watched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TMDB Results */}
        {mode === "tmdb" && tmdbResults.length > 0 && (
          <div>
            <p className="text-[#737373] text-sm mb-4">
              {tmdbResults.length} result{tmdbResults.length !== 1 ? "s" : ""} from TMDB
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {tmdbResults.map((result) => {
                const title = result.title || result.name || "Unknown";
                const year = (result.release_date || result.first_air_date || "").split("-")[0];
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result.id, result.media_type)}
                    className="group bg-[#0a0a0a] border border-[#262626] rounded-xl overflow-hidden hover:border-[#3b82f6]/50 transition-colors text-left"
                  >
                    <div className="relative aspect-[2/3]">
                      <Image
                        src={getImageUrl(result.poster_path, "w342")}
                        alt={title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          {isInWatchlist(result.id) ? (
                            <span className="px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] rounded text-xs font-medium">
                              In Watchlist
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-[#3b82f6] text-white rounded text-xs font-medium">
                              + Add
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[#737373] text-xs">{year}</span>
                        <span className="text-xs bg-[#1a1a1a] text-[#a3a3a3] px-1.5 py-0.5 rounded">
                          {result.media_type === "tv" ? "TV" : "Movie"}
                        </span>
                        {result.vote_average > 0 && (
                          <span className="text-yellow-400 text-xs">★ {result.vote_average.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-3 mt-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-4 p-4 rounded-xl border border-[#262626] bg-[#0a0a0a] animate-pulse"
              >
                <div className="w-20 h-28 bg-[#262626] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#262626] rounded w-1/3" />
                  <div className="h-3 bg-[#262626] rounded w-2/3" />
                  <div className="h-1 bg-[#262626] rounded-full w-full" />
                  <div className="flex gap-2">
                    <div className="h-6 bg-[#262626] rounded-lg w-24" />
                    <div className="h-6 bg-[#262626] rounded-lg w-28" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
