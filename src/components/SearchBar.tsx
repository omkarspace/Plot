"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from "@/lib/localStorage";
import type { TMDBSearchResult, SearchHistoryItem } from "@/types";

interface SearchBarProps {
  onSelect: (result: TMDBSearchResult) => void;
}

interface SearchAPIResponse {
  results: TMDBSearchResult[];
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => getSearchHistory());
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    setHighlightIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tmdb/search?q=${encodeURIComponent(value)}`);
        if (!response.ok) throw new Error("Search failed");
        const data: SearchAPIResponse = await response.json();
        const filtered = data.results
          .filter((r) => r.media_type === "tv" || r.media_type === "movie")
          .slice(0, 8);
        setResults(filtered);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelect = (result: TMDBSearchResult) => {
    addToSearchHistory({
      id: result.id,
      type: result.media_type,
      title: result.title || result.name || "Unknown",
      posterPath: result.poster_path,
    });
    setHistory(getSearchHistory());
    onSelect(result);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleHistorySelect = (item: SearchHistoryItem) => {
    setQuery(item.title);
    handleSearch(item.title);
  };

  const getTitle = (result: TMDBSearchResult) => result.title || result.name || "Unknown";
  const getYear = (result: TMDBSearchResult) => {
    const date = result.release_date || result.first_air_date;
    return date ? new Date(date).getFullYear() : "";
  };

  const showHistory = isFocused && !query && history.length > 0;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Search Input — station information desk */}
      <div className="relative">
        <div className="flex items-center bg-flap-black border border-ruled">
          {/* Magnifying glass icon */}
          <div className="pl-4 pr-3 flex-shrink-0">
            <svg className="w-5 h-5 text-steel-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="SEARCH DEPARTURES"
            className="flex-1 py-4 bg-transparent text-flap-white placeholder-steel-dark text-sm uppercase tracking-wider focus:outline-none font-[family-name:var(--font-board)] font-medium"
          />
          {isLoading && (
            <div className="pr-4">
              <div className="w-4 h-4 border-2 border-delay-amber border-t-transparent animate-spin" />
            </div>
          )}
          {!isLoading && query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
                setIsOpen(false);
              }}
              className="pr-4 text-steel-dark hover:text-flap-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Search History — recent departures */}
      {showHistory && (
        <div className="absolute z-50 w-full mt-1 bg-flap-black border border-ruled shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-ruled">
            <p className="text-steel-dark text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-board)]">
              Recent Departures
            </p>
            <button
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
              }}
              className="text-steel-dark text-[10px] uppercase tracking-wider hover:text-steel-frame transition-colors font-[family-name:var(--font-board)]"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {history.map((item) => (
              <button
                key={`${item.id}-${item.timestamp}`}
                onClick={() => handleHistorySelect(item)}
                className="flex items-center gap-3 px-4 py-3 border-b border-ruled hover:bg-flap-shadow transition-colors flex-shrink-0 group"
              >
                <Image
                  src={getImageUrl(item.posterPath, "w45")}
                  alt={item.title}
                  width={24}
                  height={36}
                  className="flex-shrink-0"
                />
                <span className="text-flap-white text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium truncate max-w-[140px] group-hover:text-delay-amber transition-colors">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results — departure list */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-flap-black border border-ruled shadow-2xl">
          {/* Column headers */}
          <div className="departure-row text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)] border-b border-ruled">
            <span>Time</span>
            <span>Destination</span>
            <span>Type</span>
            <span>Rating</span>
            <span></span>
          </div>
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightIndex(index)}
              className={`w-full departure-row transition-colors ${
                index === highlightIndex
                  ? "bg-flap-shadow"
                  : "hover:bg-flap-shadow"
              }`}
            >
              <span className="text-steel-dark font-[family-name:var(--font-mono)] text-xs">
                {getYear(result)}
              </span>
              <span className="text-flap-white uppercase tracking-wider font-[family-name:var(--font-board)] font-medium text-sm truncate">
                {getTitle(result)}
              </span>
              <span className="text-steel-dark text-xs uppercase font-[family-name:var(--font-board)]">
                {result.media_type}
              </span>
              <span className="status-on-time font-[family-name:var(--font-mono)] text-xs">
                {result.vote_average.toFixed(1)}
              </span>
              <span className="text-steel-dark text-xs">→</span>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-flap-black border border-ruled p-6 text-center">
          <p className="text-steel-dark text-sm uppercase tracking-wider font-[family-name:var(--font-board)]">
            No departures found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
