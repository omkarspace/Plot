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
  onTimeBudgetChange,
  onServiceToggle,
  onGenreToggle,
  onReset,
}: SmartFilterProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl border border-[#262626] p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">What can I watch right now?</h2>
          <p className="text-[#737373] text-sm">
            Pick your time, services, and mood — we&apos;ll find the perfect match
          </p>
        </div>
        {isFilterActive && (
          <button
            onClick={onReset}
            className="text-[#3b82f6] text-sm hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-6">
        <TimeBudgetSlider value={timeBudget} onChange={onTimeBudgetChange} />
        <ServiceSelector selected={selectedServices} onToggle={onServiceToggle} />
        <MoodFilter selected={selectedGenres} onToggle={onGenreToggle} />
      </div>

      {isFilterActive && (
        <div className="mt-4 pt-4 border-t border-[#262626] text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#737373]">Finding matches...</p>
            </div>
          ) : (
            <p className="text-[#737373]">
              <span className="text-[#3b82f6] font-semibold">{resultCount}</span> items
              match your criteria
            </p>
          )}
        </div>
      )}
    </div>
  );
}
