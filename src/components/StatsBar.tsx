"use client";

import { formatDaysHours } from "@/lib/time";

interface StatsBarProps {
  totalMinutes: number;
  count: number;
}

export default function StatsBar({ totalMinutes, count }: StatsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-ruled mb-4">
      <h2 className="text-flap-white text-sm uppercase tracking-[0.15em] font-[family-name:var(--font-board)] font-semibold">
        Booked Departures
      </h2>
      <div className="flex items-center gap-4 text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
        <span className="text-steel-frame">
          {count} {count === 1 ? "show" : "shows"}
        </span>
        <span className="text-delay-amber font-[family-name:var(--font-mono)] font-medium">
          {formatDaysHours(totalMinutes)} total
        </span>
      </div>
    </div>
  );
}
