"use client";

import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime } from "@/lib/time";
import type { FilterResult } from "@/types";

interface FilteredResultsProps {
  results: FilterResult[];
  onSelect: (id: number) => void;
  onAddToWatchlist: (id: number) => void;
}

export default function FilteredResults({
  results,
  onSelect,
}: FilteredResultsProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#737373] text-lg mb-2">No matches found</p>
        <p className="text-[#525252] text-sm">
          Try adjusting your time or service filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <div
          key={result.item.id}
          className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
            result.fitsInTime
              ? "bg-[#1a1a1a] border-[#262626] hover:border-[#3b82f6]/50"
              : "bg-[#1a1a1a]/50 border-[#262626]/50 opacity-60"
          }`}
          onClick={() => onSelect(result.item.id)}
        >
          <img
            src={getImageUrl(result.item.posterPath, "w92")}
            alt={result.item.title}
            className="w-12 h-18 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{result.item.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[#737373] text-sm">
                {formatRuntime(result.item.totalRuntimeMinutes)}
              </span>
              {result.item.type === "tv" && (
                <span className="px-1.5 py-0.5 bg-[#262626] rounded text-xs text-[#737373]">
                  TV
                </span>
              )}
              {result.fitsInTime && (
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                  Fits your time
                </span>
              )}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-[#737373] text-xs">
            {result.matchScore}%
          </div>
        </div>
      ))}
    </div>
  );
}
