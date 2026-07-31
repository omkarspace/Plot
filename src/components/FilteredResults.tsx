"use client";

import { useEffect, useRef, useState } from "react";
import { formatRuntime } from "@/lib/time";
import type { WatchlistItem, DiscoveryItem } from "@/types";

interface FilteredResultsProps {
  watchlistItems: WatchlistItem[];
  discoveryItems: DiscoveryItem[];
  timeMaxMinutes: number;
  onSelect: (id: number, type: "tv" | "movie") => void;
  isLoading: boolean;
}

export default function FilteredResults({
  watchlistItems,
  discoveryItems,
  timeMaxMinutes,
  onSelect,
  isLoading,
}: FilteredResultsProps) {
  const [displayedWatchlist, setDisplayedWatchlist] = useState<WatchlistItem[]>([]);
  const [displayedDiscovery, setDisplayedDiscovery] = useState<DiscoveryItem[]>([]);
  const prevTotal = useRef(watchlistItems.length + discoveryItems.length);

  // Cascade animation on results update
  useEffect(() => {
    const total = watchlistItems.length + discoveryItems.length;
    if (total > 0 && total !== prevTotal.current) {
      // Stagger in new items
      let index = 0;
      const showNext = () => {
        if (index < watchlistItems.length) {
          setDisplayedWatchlist((prev) => [...prev, watchlistItems[index]]);
          index++;
          setTimeout(showNext, 30);
        } else if (index - watchlistItems.length < discoveryItems.length) {
          const discIndex = index - watchlistItems.length;
          setDisplayedDiscovery((prev) => [...prev, discoveryItems[discIndex]]);
          index++;
          setTimeout(showNext, 30);
        }
      };
      // Only animate new items, not initial load
      if (prevTotal.current > 0) {
        setDisplayedWatchlist([]);
        setDisplayedDiscovery([]);
        showNext();
      } else {
        setDisplayedWatchlist(watchlistItems);
        setDisplayedDiscovery(discoveryItems);
      }
    } else if (prevTotal.current === 0) {
      setDisplayedWatchlist(watchlistItems);
      setDisplayedDiscovery(discoveryItems);
    }
    prevTotal.current = total;
  }, [watchlistItems, discoveryItems]);

  if (isLoading) {
    return (
      <div className="board-frame">
        <div className="departure-row text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)] bg-board-surface border-b border-ruled">
          <span>Time</span>
          <span>Destination</span>
          <span>Type</span>
          <span>Status</span>
          <span></span>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="departure-row animate-pulse"
          >
            <div className="h-3 bg-flap-shadow w-12" />
            <div className="h-3 bg-flap-shadow w-3/4" />
            <div className="h-3 bg-flap-shadow w-12" />
            <div className="h-3 bg-flap-shadow w-16" />
            <div />
          </div>
        ))}
      </div>
    );
  }

  const totalItems = displayedWatchlist.length + displayedDiscovery.length;

  if (totalItems === 0) {
    return (
      <div className="board-frame p-8 text-center">
        <p className="text-steel-dark text-sm uppercase tracking-wider font-[family-name:var(--font-board)]">
          No departures match your schedule
        </p>
        <p className="text-steel-dark/60 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] mt-2">
          Try adjusting your time or platforms
        </p>
      </div>
    );
  }

  return (
    <div className="board-frame">
      {/* Column headers */}
      <div className="departure-row text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)] bg-board-surface border-b border-ruled">
        <span>Time</span>
        <span>Destination</span>
        <span>Type</span>
        <span>Status</span>
        <span></span>
      </div>

      {/* Watchlist items */}
      {displayedWatchlist.map((item, index) => {
        const fitsInTime = timeMaxMinutes === Infinity || item.totalRuntimeMinutes <= timeMaxMinutes;
        return (
          <button
            key={`wl-${item.id}`}
            onClick={() => onSelect(item.id, item.type)}
            className={`w-full departure-row transition-colors row-slide-in ${
              fitsInTime
                ? "hover:bg-flap-shadow"
                : "opacity-50 hover:bg-flap-shadow"
            }`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="text-steel-frame font-[family-name:var(--font-mono)] text-xs">
              {formatRuntime(item.totalRuntimeMinutes)}
            </span>
            <span className="text-flap-white uppercase tracking-wider font-[family-name:var(--font-board)] font-medium text-sm truncate text-left">
              {item.title}
            </span>
            <span className="text-steel-dark text-xs uppercase font-[family-name:var(--font-board)]">
              {item.type === "tv" ? "TV" : "MOV"}
            </span>
            <span className={fitsInTime ? "status-on-time" : "status-over-time"}>
              {fitsInTime ? "ON TIME" : "DELAYED"}
            </span>
            <span className="text-steel-dark text-xs">→</span>
          </button>
        );
      })}

      {/* Divider */}
      {displayedDiscovery.length > 0 && displayedWatchlist.length > 0 && (
        <div className="px-4 py-2 border-b border-ruled bg-board-surface">
          <span className="text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)]">
            More Departures
          </span>
        </div>
      )}

      {/* Discovery results */}
      {displayedDiscovery.map((item, index) => (
        <button
          key={`disc-${item.id}`}
          onClick={() => onSelect(item.id, item.type)}
          className="w-full departure-row hover:bg-flap-shadow transition-colors row-slide-in"
          style={{ animationDelay: `${(displayedWatchlist.length + index) * 30}ms` }}
        >
          <span className="text-steel-frame font-[family-name:var(--font-mono)] text-xs">
            {item.year}
          </span>
          <span className="text-flap-white uppercase tracking-wider font-[family-name:var(--font-board)] font-medium text-sm truncate text-left">
            {item.title}
          </span>
          <span className="text-steel-dark text-xs uppercase font-[family-name:var(--font-board)]">
            {item.type === "tv" ? "TV" : "MOV"}
          </span>
          <span className={item.rating > 7 ? "status-on-time" : "text-steel-dark font-[family-name:var(--font-mono)] text-xs"}>
            {item.rating > 0 ? item.rating.toFixed(1) : "—"}
          </span>
          <span className="text-steel-dark text-xs">→</span>
        </button>
      ))}
    </div>
  );
}
