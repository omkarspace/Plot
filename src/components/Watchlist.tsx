"use client";

import { useMemo, useState } from "react";
import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime } from "@/lib/time";
import ShareButton from "./ShareButton";
import type { WatchlistItem } from "@/types";

type SortOption = "recent" | "title-asc" | "title-desc" | "longest" | "shortest";
type FilterType = "all" | "tv" | "movie";

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (id: number) => void;
}

export default function Watchlist({ items, onRemove }: WatchlistProps) {
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const displayed = useMemo(() => {
    const filtered =
      filterType === "all" ? items : items.filter((i) => i.type === filterType);

    const sorted = [...filtered];
    switch (sortBy) {
      case "title-asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title-desc":
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "longest":
        sorted.sort((a, b) => b.totalRuntimeMinutes - a.totalRuntimeMinutes);
        break;
      case "shortest":
        sorted.sort((a, b) => a.totalRuntimeMinutes - b.totalRuntimeMinutes);
        break;
      case "recent":
      default:
        sorted.sort((a, b) => b.addedAt - a.addedAt);
        break;
    }
    return sorted;
  }, [items, sortBy, filterType]);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#737373] text-lg mb-2">Your watchlist is empty</p>
        <p className="text-[#525252] text-sm">
          Search for a TV show or movie above to get started
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex gap-2">
          {(["all", "tv", "movie"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filterType === f
                  ? "bg-[#3b82f6] text-white"
                  : "bg-[#262626] text-[#737373] hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "tv" ? "TV" : "Movies"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <ShareButton items={items} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-[#1a1a1a] border border-[#262626] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="recent">Recently Added</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="longest">Longest First</option>
            <option value="shortest">Shortest First</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayed.map((item) => (
          <div
            key={item.id}
            className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#262626] hover:border-[#3b82f6]/50 transition-colors"
          >
            <img
              src={getImageUrl(item.posterPath, "w342")}
              alt={item.title}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="p-3">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              <p className="text-[#3b82f6] text-sm font-semibold">
                {formatRuntime(item.totalRuntimeMinutes)}
              </p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              title="Remove from watchlist"
            >
              <span className="text-white text-sm">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
