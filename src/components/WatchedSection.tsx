"use client";

import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime } from "@/lib/time";
import type { WatchedItem } from "@/types";

interface WatchedSectionProps {
  items: WatchedItem[];
  onRemove: (id: number) => void;
}

export default function WatchedSection({ items, onRemove }: WatchedSectionProps) {
  if (items.length === 0) return null;

  const totalMinutes = items.reduce((sum, item) => sum + item.totalRuntimeMinutes, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold text-white">Watched</h2>
        <span className="text-[#737373] text-sm">
          {items.length} {items.length === 1 ? "item" : "items"} · {formatRuntime(totalMinutes)} total
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#262626] hover:border-green-500/50 transition-colors"
          >
            <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <img
              src={getImageUrl(item.posterPath, "w342")}
              alt={item.title}
              className="w-full aspect-[2/3] object-cover"
            />
            <div className="p-3">
              <p className="text-white text-sm font-medium truncate">{item.title}</p>
              <p className="text-green-400 text-sm font-semibold">
                {formatRuntime(item.totalRuntimeMinutes)}
              </p>
            </div>
            <button
              onClick={() => onRemove(item.id)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
              title="Remove from watched"
            >
              <span className="text-white text-sm">×</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
