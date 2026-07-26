"use client";

import { getImageUrl } from "@/lib/tmdb";
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
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-xl border border-[#262626] bg-[#1a1a1a] animate-pulse"
          >
            <div className="w-12 h-18 bg-[#262626] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#262626] rounded w-3/4" />
              <div className="h-3 bg-[#262626] rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const totalItems = watchlistItems.length + discoveryItems.length;

  if (totalItems === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#737373] text-lg mb-2">No matches found</p>
        <p className="text-[#525252] text-sm">
          Try selecting different services or moods
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Watchlist items first */}
      {watchlistItems.map((item) => {
        const fitsInTime = timeMaxMinutes === Infinity || item.totalRuntimeMinutes <= timeMaxMinutes;
        return (
          <div
            key={`wl-${item.id}`}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
              fitsInTime
                ? "bg-[#1a1a1a] border-[#262626] hover:border-[#3b82f6]/50"
                : "bg-[#1a1a1a]/50 border-[#262626]/50 opacity-60"
            }`}
            onClick={() => onSelect(item.id, item.type)}
          >
            <img
              src={getImageUrl(item.posterPath, "w92")}
              alt={item.title}
              className="w-12 h-18 object-cover rounded-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#737373] text-sm">
                  {formatRuntime(item.totalRuntimeMinutes)}
                </span>
                <span className="px-1.5 py-0.5 bg-[#262626] rounded text-xs text-[#737373]">
                  {item.type === "tv" ? "TV" : "Movie"}
                </span>
                <span className="px-1.5 py-0.5 bg-[#3b82f6]/20 text-[#3b82f6] rounded text-xs">
                  In watchlist
                </span>
                {fitsInTime && (
                  <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                    Fits your time
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Discovery results from TMDB */}
      {discoveryItems.length > 0 && watchlistItems.length > 0 && (
        <div className="py-2 text-center">
          <p className="text-[#525252] text-xs uppercase tracking-wide">More from TMDB</p>
        </div>
      )}
      {discoveryItems.map((item) => (
        <div
          key={`disc-${item.id}`}
          className="flex items-center gap-4 p-4 rounded-xl border bg-[#1a1a1a] border-[#262626] hover:border-[#3b82f6]/50 transition-all cursor-pointer"
          onClick={() => onSelect(item.id, item.type)}
        >
          <img
            src={getImageUrl(item.posterPath, "w92")}
            alt={item.title}
            className="w-12 h-18 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#737373] text-sm">{item.year}</span>
              <span className="px-1.5 py-0.5 bg-[#262626] rounded text-xs text-[#737373]">
                {item.type === "tv" ? "TV" : "Movie"}
              </span>
              {item.rating > 0 && (
                <span className="text-yellow-400 text-xs">★ {item.rating.toFixed(1)}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
