"use client";

import { formatDaysHours } from "@/lib/time";

interface StatsBarProps {
  totalMinutes: number;
  count: number;
}

export default function StatsBar({ totalMinutes, count }: StatsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between py-4 border-b border-[#262626] mb-6">
      <h2 className="text-lg font-semibold text-white">
        Your Watchlist
      </h2>
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#737373]">
          {count} {count === 1 ? "show" : "shows"}
        </span>
        <span className="text-[#3b82f6] font-semibold">
          {formatDaysHours(totalMinutes)} total
        </span>
      </div>
    </div>
  );
}
