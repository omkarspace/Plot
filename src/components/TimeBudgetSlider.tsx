"use client";

import type { TimeBudget } from "@/types";

interface TimeBudgetSliderProps {
  value: TimeBudget;
  onChange: (budget: TimeBudget) => void;
}

const BUDGETS: { id: TimeBudget; label: string; time: string }[] = [
  { id: "30min", label: "Quick Stop", time: "30m" },
  { id: "1hr", label: "One Act", time: "1h" },
  { id: "2hr", label: "Feature", time: "2h" },
  { id: "all", label: "No Limit", time: "∞" },
];

export default function TimeBudgetSlider({ value, onChange }: TimeBudgetSliderProps) {
  return (
    <div>
      <p className="text-steel-dark text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-board)] mb-3">
        How long is your evening?
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-ruled">
        {BUDGETS.map((budget) => (
          <button
            key={budget.id}
            onClick={() => onChange(budget.id)}
            className={`px-4 py-3 text-left transition-colors border-r border-ruled last:border-r-0 ${
              value === budget.id
                ? "bg-delay-amber/10 border-b-2 border-b-delay-amber"
                : "hover:bg-flap-shadow border-b-2 border-b-transparent"
            }`}
          >
            <span
              className={`block text-lg font-bold font-[family-name:var(--font-mono)] ${
                value === budget.id ? "text-delay-amber" : "text-flap-white"
              }`}
            >
              {budget.time}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] mt-0.5">
              {budget.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
