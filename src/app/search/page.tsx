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

  const handleAddToWatchlist = (result: { showId: number; type: "tv" | "movie"; title: string; posterPath: string | null }) => {
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
    <main className="min-h-screen px-4 py-8 md:py-12 bg-flap-black">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 flap-cascade">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 font-[family-name:var(--font-board)] text-flap-white">
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "0ms" }}>S</span>
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "50ms" }}>E</span>
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "100ms" }}>A</span>
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "150ms" }}>R</span>
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "200ms" }}>C</span>
            <span className="flap-char text-4xl md:text-5xl w-12 h-14 flap-animate" style={{ animationDelay: "250ms" }}>H</span>
          </h1>
          <p className="text-steel-dark text-sm font-[family-name:var(--font-board)] uppercase tracking-wider">
            Find departures using natural language or search TMDB directly
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="board-frame inline-flex p-1 steel-texture">
            <button
              onClick={() => handleModeChange("semantic")}
              className={`px-4 py-2 rounded text-sm font-medium transition-all font-[family-name:var(--font-board)] uppercase tracking-wider ${
                mode === "semantic"
                  ? "bg-delay-amber text-flap-black"
                  : "text-steel-frame hover:text-delay-amber"
              }`}
            >
              Semantic
            </button>
            <button
              onClick={() => handleModeChange("tmdb")}
              className={`px-4 py-2 rounded text-sm font-medium transition-all font-[family-name:var(--font-board)] uppercase tracking-wider ${
                mode === "tmdb"
                  ? "bg-delay-amber text-flap-black"
                  : "text-steel-frame hover:text-delay-amber"
              }`}
            >
              TMDB
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
              className="flex-1 flap-char bg-flap-shadow border border-ruled rounded-none px-4 py-3 text-flap-white placeholder-steel-dark focus:outline-none focus:border-delay-amber transition-colors font-[family-name:var(--font-board)] text-base"
            />
            {mode === "semantic" && (
              <button
                onClick={() => handleSemanticSearch(query)}
                disabled={!query.trim() || isLoading}
                className="px-6 py-3 bg-delay-amber text-flap-black font-medium rounded-none hover:bg-delay-amber/90 transition-colors disabled:opacity-50 font-[family-name:var(--font-board)] uppercase tracking-wider text-sm"
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            )}
            {mode === "tmdb" && isLoading && (
              <div className="flex items-center px-4">
                <div className="w-5 h-5 border-2 border-delay-amber border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* KB Status Badge */}
          {mode === "semantic" && kbStatus && (
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  kbStatus.seeded ? "bg-delay-amber" : "bg-delay-amber/50"
                }`}
              />
              <span className="text-xs text-steel-dark font-[family-name:var(--font-board)] uppercase tracking-wider">
                {kbStatus.seeded
                  ? `${kbStatus.totalShows} departures in knowledge base`
                  : "Knowledge base empty — seed it first"}
              </span>
              {!kbStatus.seeded && (
                <Link
                  href="/"
                  className="text-xs text-delay-amber hover:underline font-[family-name:var(--font-board)]"
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
                <p className="text-steel-dark text-xs uppercase tracking-wider mb-3 font-[family-name:var(--font-board)]">
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
                      className="px-3 py-1.5 bg-flap-shadow border border-ruled rounded-none text-sm text-steel-frame hover:border-delay-amber/50 hover:text-delay-amber transition-colors font-[family-name:var(--font-board)]"
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-steel-dark text-xs uppercase tracking-wider mb-3 font-[family-name:var(--font-board)]">
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
                    className="px-4 py-3 bg-flap-shadow border border-ruled rounded-none text-left text-sm text-steel-frame hover:border-delay-amber/50 hover:text-flap-white transition-colors font-[family-name:var(--font-board)]"
                  >
                    <span className="text-delay-amber mr-2">→</span>
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
            <p className="text-steel-dark text-sm font-[family-name:var(--font-board)]">
              Start typing to search TMDB&apos;s catalog of movies and TV shows
            </p>
          </div>
        )}

        {/* No Results */}
        {searched && !isLoading && mode === "semantic" && aggregatedResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-steel-dark text-lg mb-2 font-[family-name:var(--font-board)]">No matches found</p>
            <p className="text-steel-frame text-sm">
              Try rephrasing your query or seed more content into the knowledge base
            </p>
          </div>
        )}

        {searched && !isLoading && mode === "tmdb" && tmdbResults.length === 0 && (
          <div className="text-center py-16">
            <p className="text-steel-dark text-lg mb-2 font-[family-name:var(--font-board)]">No results found</p>
            <p className="text-steel-frame text-sm">
              Try a different search term
            </p>
          </div>
        )}

        {/* Semantic Results */}
        {mode === "semantic" && aggregatedResults.length > 0 && (
          <div className="board-frame overflow-hidden">
            <div className="px-4 py-3 border-b border-ruled bg-board-surface">
              <p className="text-steel-dark text-sm font-[family-name:var(--font-board)] uppercase tracking-wider">
                {aggregatedResults.length} departure{aggregatedResults.length !== 1 ? "s" : ""} matched
                <span className="text-steel-frame ml-1 font-[family-name:var(--font-mono)]">
                  ({semanticResults.length} chunks analyzed)
                </span>
              </p>
            </div>

            <div className="divide-y divide-ruled">
              {aggregatedResults.map((result, index) => (
                <div
                  key={result.showId}
                  className={`departure-row group row-slide-in ${index % 2 === 1 ? "bg-row-alt" : ""}`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-stretch w-full">
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
                          <div className="flex items-center gap-2 mb-1 flap-cascade">
                            <button
                              onClick={() => handleSelectResult(result.showId, result.type)}
                              className="font-semibold text-flap-white hover:text-delay-amber transition-colors truncate font-[family-name:var(--font-board)]"
                            >
                              {result.title}
                            </button>
                            <span className="text-xs bg-flap-shadow text-steel-frame px-2 py-0.5 rounded-none flex-shrink-0 font-[family-name:var(--font-board)] uppercase tracking-wider">
                              {result.type === "tv" ? "TV" : "Movie"}
                            </span>
                          </div>

                          {/* Best matching chunk */}
                          <p className="text-steel-frame text-sm line-clamp-2 mb-2 font-[family-name:var(--font-board)]">
                            {result.chunks[0]?.content || ""}
                          </p>

                          {/* Match sources */}
                          {result.chunks.length > 1 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {result.chunks.map((chunk, ci) => (
                                <span
                                  key={ci}
                                  className="text-[10px] bg-flap-shadow text-steel-dark px-1.5 py-0.5 rounded-none font-[family-name:var(--font-board)] uppercase"
                                >
                                  {chunk.field}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-lg font-bold font-[family-name:var(--font-mono)] ${
                            result.bestScore >= 0.6
                              ? "text-delay-amber"
                              : result.bestScore >= 0.4
                              ? "text-delay-amber"
                              : result.bestScore >= 0.25
                              ? "text-delay-amber"
                              : "text-steel-dark"
                          }`}>
                            {(result.bestScore * 100).toFixed(0)}%
                          </div>
                          <p className="text-[10px] text-steel-dark font-[family-name:var(--font-mono)]">{getScoreLabel(result.bestScore)}</p>
                        </div>
                      </div>

                      {/* Score bar */}
                      <div className="mt-2 mb-3">
                        <div className="h-1 bg-flap-shadow rounded-none overflow-hidden">
                          <div
                            className={`h-full rounded-none transition-all ${
                              result.bestScore >= 0.6
                                ? "bg-delay-amber"
                                : result.bestScore >= 0.4
                                ? "bg-delay-amber"
                                : result.bestScore >= 0.25
                                ? "bg-delay-amber"
                                : "bg-steel-dark"
                            }`}
                            style={{ width: `${Math.min(result.bestScore * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectResult(result.showId, result.type)}
                          className="px-3 py-1.5 bg-flap-shadow border border-ruled rounded-none text-xs text-steel-frame hover:border-delay-amber/50 hover:text-flap-white transition-colors font-[family-name:var(--font-board)] uppercase tracking-wider"
                        >
                          View Details
                        </button>
                        {isInWatchlist(result.showId) ? (
                          <span className="px-3 py-1.5 bg-delay-amber/10 text-delay-amber rounded-none text-xs font-medium font-[family-name:var(--font-board)] uppercase tracking-wider border border-delay-amber/20">
                            In Watchlist
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddToWatchlist(result)}
                            className="px-3 py-1.5 bg-delay-amber text-flap-black rounded-none text-xs font-medium hover:bg-delay-amber/90 transition-colors font-[family-name:var(--font-board)] uppercase tracking-wider"
                          >
                            + Add to Watchlist
                          </button>
                        )}
                        {isWatched(result.showId) && (
                          <span className="px-3 py-1.5 bg-delay-amber/10 text-delay-amber rounded-none text-xs font-medium font-[family-name:var(--font-board)] uppercase tracking-wider border border-delay-amber/20">
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
          <div className="board-frame overflow-hidden">
            <div className="px-4 py-3 border-b border-ruled bg-board-surface">
              <p className="text-steel-dark text-sm font-[family-name:var(--font-board)] uppercase tracking-wider">
                {tmdbResults.length} result{tmdbResults.length !== 1 ? "s" : ""} from TMDB
              </p>
            </div>

            <div className="divide-y divide-ruled">
              {tmdbResults.map((result, index) => {
                const title = result.title || result.name || "Unknown";
                const year = (result.release_date || result.first_air_date || "").split("-")[0];
                return (
                  <div
                    key={result.id}
                    className={`departure-row group row-slide-in ${index % 2 === 1 ? "bg-row-alt" : ""}`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-stretch w-full">
                      <button
                        onClick={() => handleSelectResult(result.id, result.media_type)}
                        className="flex-shrink-0 w-20 md:w-24 relative"
                      >
                        <Image
                          src={getImageUrl(result.poster_path, "w185")}
                          alt={title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 80px, 96px"
                        />
                      </button>

                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() => handleSelectResult(result.id, result.media_type)}
                                className="font-semibold text-flap-white hover:text-delay-amber transition-colors truncate font-[family-name:var(--font-board)]"
                              >
                                {title}
                              </button>
                              <span className="text-xs bg-flap-shadow text-steel-frame px-2 py-0.5 rounded-none flex-shrink-0 font-[family-name:var(--font-board)] uppercase tracking-wider">
                                {result.media_type === "tv" ? "TV" : "Movie"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-steel-frame text-sm font-[family-name:var(--font-board)]">
                              {year && <span>{year}</span>}
                              {result.vote_average > 0 && (
                                <span className="text-delay-amber">★ {result.vote_average.toFixed(1)}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          {isInWatchlist(result.id) ? (
                            <span className="px-3 py-1.5 bg-delay-amber/10 text-delay-amber rounded-none text-xs font-medium font-[family-name:var(--font-board)] uppercase tracking-wider border border-delay-amber/20">
                              In Watchlist
                            </span>
                          ) : (
                            <button
                              onClick={() => handleAddToWatchlist({
                                showId: result.id,
                                title,
                                posterPath: result.poster_path,
                                type: result.media_type,
                              })}
                              className="px-3 py-1.5 bg-delay-amber text-flap-black rounded-none text-xs font-medium hover:bg-delay-amber/90 transition-colors font-[family-name:var(--font-board)] uppercase tracking-wider"
                            >
                              + Add to Watchlist
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="board-frame overflow-hidden">
            <div className="px-4 py-3 border-b border-ruled bg-board-surface">
              <p className="text-steel-dark text-sm font-[family-name:var(--font-board)] uppercase tracking-wider">
                Searching departures...
              </p>
            </div>
            <div className="divide-y divide-ruled">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="departure-row animate-pulse"
                >
                  <div className="flex items-stretch w-full">
                    <div className="w-20 md:w-24 flex-shrink-0">
                      <div className="w-full h-full bg-flap-shadow" />
                    </div>
                    <div className="flex-1 p-4 min-w-0 space-y-3">
                      <div className="h-5 bg-flap-shadow rounded-none w-1/4" />
                      <div className="h-4 bg-flap-shadow rounded-none w-1/2" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-flap-shadow rounded-none w-24" />
                        <div className="h-6 bg-flap-shadow rounded-none w-28" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
