"use client";

import { useState, useEffect, useRef } from "react";
import { searchShows, getImageUrl } from "@/lib/tmdb";
import {
  getSearchHistory,
  addToSearchHistory,
  clearSearchHistory,
} from "@/lib/localStorage";
import type { TMDBSearchResult, SearchHistoryItem } from "@/types";

interface SearchBarProps {
  onSelect: (result: TMDBSearchResult) => void;
}

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBSearchResult[]>([]);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

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
        const data = await searchShows(value);
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
    <div ref={dropdownRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
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
          placeholder="Search for a TV show or movie..."
          className="w-full px-5 py-4 bg-[#1a1a1a] border border-[#262626] rounded-xl text-white placeholder-[#737373] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all text-lg"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showHistory && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#737373] text-xs uppercase tracking-wide">Recent</p>
            <button
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
              }}
              className="text-[#525252] text-xs hover:text-[#737373]"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {history.map((item) => (
              <button
                key={`${item.id}-${item.timestamp}`}
                onClick={() => handleHistorySelect(item)}
                className="flex items-center gap-2 px-3 py-2 bg-[#0f0f0f] rounded-full border border-[#262626] hover:border-[#3b82f6]/50 transition-colors flex-shrink-0"
              >
                <img
                  src={getImageUrl(item.posterPath, "w45")}
                  alt={item.title}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-[#a3a3a3] text-sm truncate max-w-[150px]">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden shadow-2xl">
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setHighlightIndex(index)}
              className={`w-full flex items-center gap-4 px-4 py-3 transition-colors ${
                index === highlightIndex ? "bg-[#252525]" : "hover:bg-[#1f1f1f]"
              }`}
            >
              <img
                src={getImageUrl(result.poster_path, "w92")}
                alt={getTitle(result)}
                className="w-10 h-15 object-cover rounded"
              />
              <div className="text-left flex-1 min-w-0">
                <p className="text-white font-medium truncate">{getTitle(result)}</p>
                <p className="text-[#737373] text-sm">
                  {getYear(result)} ·{" "}
                  <span className="capitalize px-1.5 py-0.5 bg-[#262626] rounded text-xs">
                    {result.media_type}
                  </span>
                </p>
              </div>
              <span className="text-[#737373] text-sm">★ {result.vote_average.toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-[#262626] rounded-xl p-4 text-center text-[#737373]">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  );
}
