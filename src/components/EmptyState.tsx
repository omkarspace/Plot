"use client";

interface EmptyStateProps {
  type: "watchlist" | "watched" | "no-results" | "no-filter-results";
}

export default function EmptyState({ type }: EmptyStateProps) {
  const states = {
    watchlist: {
      title: "Your watchlist is empty",
      description:
        "Search for a show or movie above, then add it to your watchlist",
    },
    watched: {
      title: "Nothing watched yet",
      description:
        "Start tracking your shows and movies to see your stats here",
    },
    "no-results": {
      title: "No results found",
      description: "Try a different search term",
    },
    "no-filter-results": {
      title: "Nothing matches your filters",
      description:
        "Try increasing your time budget or adding more streaming services",
    },
  };

  const state = states[type];

  return (
    <div className="text-center py-16">
      <p className="text-[#737373] text-lg mb-2">{state.title}</p>
      <p className="text-[#525252] text-sm">{state.description}</p>
    </div>
  );
}
