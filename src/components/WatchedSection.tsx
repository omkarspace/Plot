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
        <h2 className="text-flap-white text-sm uppercase tracking-[0.15em] font-[family-name:var(--font-board)] font-semibold">
          Completed Departures
        </h2>
        <span className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
          {items.length} items · {formatRuntime(totalMinutes)} total
        </span>
      </div>

      <div className="board-frame">
        {/* Column headers */}
        <div className="departure-row text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)] bg-board-surface border-b border-ruled">
          <span>Time</span>
          <span>Destination</span>
          <span>Type</span>
          <span>Status</span>
          <span></span>
        </div>

        {items.map((item, index) => (
          <div
            key={item.id}
            className={`departure-row group ${index % 2 === 1 ? "bg-row-alt" : ""}`}
          >
            <span className="text-delay-amber font-[family-name:var(--font-mono)] text-xs font-medium">
              {formatRuntime(item.totalRuntimeMinutes)}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={getImageUrl(item.posterPath, "w45")}
                alt={item.title}
                className="w-6 h-9 object-cover flex-shrink-0 border border-ruled"
              />
              <span className="text-flap-white uppercase tracking-wider font-[family-name:var(--font-board)] font-medium text-sm truncate">
                {item.title}
              </span>
            </div>
            <span className="text-steel-dark text-xs uppercase font-[family-name:var(--font-board)]">
              {item.type === "tv" ? "TV" : "MOV"}
            </span>
            <span className="text-delay-amber font-[family-name:var(--font-mono)] text-xs">
              ✓ DONE
            </span>
            <button
              onClick={() => onRemove(item.id)}
              className="text-steel-dark hover:text-cancelled-red transition-colors text-xs font-[family-name:var(--font-board)] opacity-0 group-hover:opacity-100"
              title="Remove"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
