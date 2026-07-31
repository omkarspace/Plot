"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
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
      <div className="board-frame p-8 text-center">
        <p className="text-steel-dark text-sm uppercase tracking-wider font-[family-name:var(--font-board)]">
          No booked departures
        </p>
        <p className="text-steel-dark/60 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] mt-2">
          Search above to book your first departure
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-0 border border-ruled">
          {(["all", "tv", "movie"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-4 py-2 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium transition-colors border-r border-ruled last:border-r-0 ${
                filterType === f
                  ? "bg-delay-amber/10 text-delay-amber border-b-2 border-b-delay-amber"
                  : "text-steel-frame hover:text-flap-white hover:bg-flap-shadow border-b-2 border-b-transparent"
              }`}
            >
              {f === "all" ? "All" : f === "tv" ? "TV" : "Movies"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ShareButton items={items} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-flap-black border border-ruled text-flap-white px-3 py-2 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] focus:outline-none focus:border-delay-amber transition-colors cursor-pointer"
          >
            <option value="recent">Recent</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="longest">Longest</option>
            <option value="shortest">Shortest</option>
          </select>
        </div>
      </div>

      {/* Board — departure rows */}
      <div className="board-frame">
        {/* Column headers */}
        <div className="departure-row text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)] bg-board-surface border-b border-ruled">
          <span>Time</span>
          <span>Destination</span>
          <span>Type</span>
          <span>Rating</span>
          <span></span>
        </div>

        {displayed.map((item, index) => (
          <div
            key={item.id}
            className={`departure-row group ${index % 2 === 1 ? "bg-row-alt" : ""}`}
          >
            <span className="text-delay-amber font-[family-name:var(--font-mono)] text-xs font-medium">
              {formatRuntime(item.totalRuntimeMinutes)}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <Image
                src={getImageUrl(item.posterPath, "w45")}
                alt={item.title}
                width={24}
                height={36}
                className="flex-shrink-0 border border-ruled"
              />
              <span className="text-flap-white uppercase tracking-wider font-[family-name:var(--font-board)] font-medium text-sm truncate">
                {item.title}
              </span>
            </div>
            <span className="text-steel-dark text-xs uppercase font-[family-name:var(--font-board)]">
              {item.type === "tv" ? "TV" : "MOV"}
            </span>
            <span className="text-steel-frame font-[family-name:var(--font-mono)] text-xs">
              {item.rating ? `★ ${item.rating.toFixed(1)}` : "—"}
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
