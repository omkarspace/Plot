"use client";

interface EmptyStateProps {
  type: "watchlist" | "watched" | "no-results" | "no-filter-results";
}

export default function EmptyState({ type }: EmptyStateProps) {
  const states = {
    watchlist: {
      rows: ["NO", "BOOKED", "DEPARTURES"],
      description: "Search above to book your first departure",
    },
    watched: {
      rows: ["NOTHING", "COMPLETED", "YET"],
      description: "Start marking shows as complete to see your stats",
    },
    "no-results": {
      rows: ["NO", "MATCHES", "FOUND"],
      description: "Try a different search term",
    },
    "no-filter-results": {
      rows: ["NO", "DEPARTURES", "MATCH"],
      description: "Try increasing your time budget or adding more platforms",
    },
  };

  const state = states[type];

  return (
    <div className="board-frame p-8 text-center">
      <div className="flex gap-[2px] justify-center mb-4">
        {state.rows.map((word, wi) => (
          <span key={wi} className="flex gap-[2px]">
            {word.split("").map((char, ci) => (
              <span
                key={ci}
                className="flap-char text-lg w-7 h-9"
              >
                {char}
              </span>
            ))}
            {wi < state.rows.length - 1 && <span className="w-3" />}
          </span>
        ))}
      </div>
      <p className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
        {state.description}
      </p>
    </div>
  );
}
