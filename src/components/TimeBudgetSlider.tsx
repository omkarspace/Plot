"use client";

import type { TimeBudget } from "@/types";

interface TimeBudgetSliderProps {
  value: TimeBudget;
  onChange: (budget: TimeBudget) => void;
}

const BUDGETS: { id: TimeBudget; label: string; emoji: string }[] = [
  { id: "30min", label: "30 min", emoji: "⏱️" },
  { id: "1hr", label: "1 hour", emoji: "🕐" },
  { id: "2hr", label: "2 hours", emoji: "🕑" },
  { id: "all", label: "No limit", emoji: "♾️" },
];

export default function TimeBudgetSlider({ value, onChange }: TimeBudgetSliderProps) {
  return (
    <div>
      <p className="text-[#737373] text-sm mb-3">How much time do you have?</p>
      <div className="flex gap-2">
        {BUDGETS.map((budget) => (
          <button
            key={budget.id}
            onClick={() => onChange(budget.id)}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              value === budget.id
                ? "bg-[#3b82f6] text-white"
                : "bg-[#1a1a1a] text-[#737373] hover:bg-[#252525] hover:text-white border border-[#262626]"
            }`}
          >
            <span className="block text-lg mb-1">{budget.emoji}</span>
            {budget.label}
          </button>
        ))}
      </div>
    </div>
  );
}
