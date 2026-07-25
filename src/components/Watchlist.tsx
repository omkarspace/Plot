"use client";

import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime } from "@/lib/time";
import type { WatchlistItem } from "@/types";

interface WatchlistProps {
  items: WatchlistItem[];
  onRemove: (id: number) => void;
}

export default function Watchlist({ items, onRemove }: WatchlistProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
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
  );
}
