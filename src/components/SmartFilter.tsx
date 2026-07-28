"use client";

import type { TimeBudget } from "@/types";
import TimeBudgetSlider from "./TimeBudgetSlider";
import ServiceSelector from "./ServiceSelector";
import MoodFilter from "./MoodFilter";

interface SmartFilterProps {
  timeBudget: TimeBudget;
  selectedServices: string[];
  selectedGenres: string[];
  isFilterActive: boolean;
  isLoading: boolean;
  resultCount: number;
  watchlistCount: number;
  onTimeBudgetChange: (budget: TimeBudget) => void;
  onServiceToggle: (serviceId: string) => void;
  onGenreToggle: (genre: string) => void;
  onReset: () => void;
}

export default function SmartFilter({
  timeBudget,
  selectedServices,
  selectedGenres,
  isFilterActive,
  isLoading,
  resultCount,
  watchlistCount,
  onTimeBudgetChange,
  onServiceToggle,
  onGenreToggle,
  onReset,
}: SmartFilterProps) {
  return (
    <div className="board-frame mb-8">
      {/* Board header row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ruled bg-board-surface">
        <div className="flex items-center gap-4">
          <h2 className="text-flap-white text-sm uppercase tracking-[0.15em] font-[family-name:var(--font-board)] font-semibold">
            Filter Departures
          </h2>
          {watchlistCount > 0 && (
            <span className="text-delay-amber text-[10px] uppercase tracking-[0.15em] font-[family-name:var(--font-mono)] font-medium">
              {watchlistCount} booked
            </span>
          )}
        </div>
        {isFilterActive && (
          <button
            onClick={onReset}
            className="text-steel-dark text-[10px] uppercase tracking-wider hover:text-delay-amber transition-colors font-[family-name:var(--font-board)]"
          >
            Reset Board
          </button>
        )}
      </div>

      {/* Filter controls */}
      <div className="p-4 space-y-5">
        <TimeBudgetSlider value={timeBudget} onChange={onTimeBudgetChange} />
        <ServiceSelector selected={selectedServices} onToggle={onServiceToggle} />
        <MoodFilter selected={selectedGenres} onToggle={onGenreToggle} />
      </div>

      {/* Results count — board footer */}
      {isFilterActive && (
        <div className="px-4 py-3 border-t border-ruled bg-board-surface">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 border-2 border-delay-amber border-t-transparent animate-spin" />
              <p className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
                Scanning departures...
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-delay-amber text-lg font-bold font-[family-name:var(--font-mono)]">
                {resultCount}
              </span>
              <span className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
                {resultCount === 1 ? "departure matches" : "departures match"} your schedule
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
