import type { FilterCriteria, FilterResult, WatchlistItem } from "@/types";

const TIME_BUDGET_MINUTES: Record<string, number> = {
  "30min": 30,
  "1hr": 60,
  "2hr": 120,
  all: Infinity,
};

export const filterWatchlist = (
  criteria: FilterCriteria,
  items: WatchlistItem[]
): FilterResult[] => {
  const maxMinutes = TIME_BUDGET_MINUTES[criteria.timeBudget] || Infinity;

  const results: FilterResult[] = items.map((item) => {
    const typeMatch = criteria.type === "all" || item.type === criteria.type;

    const serviceMatch = criteria.services.length === 0;

    const genreMatch = criteria.genres.length === 0;

    const fitsInTime = item.totalRuntimeMinutes <= maxMinutes;

    let matchScore = 0;
    if (typeMatch) matchScore += 25;
    if (serviceMatch) matchScore += 25;
    if (genreMatch) matchScore += 25;
    if (fitsInTime) matchScore += 25;

    return { item, fitsInTime, availableOn: [], matchScore };
  });

  return results
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};

export const calculateFilteredStats = (
  results: FilterResult[]
): { totalMinutes: number; count: number; fitsCount: number } => {
  const totalMinutes = results.reduce((sum, r) => sum + r.item.totalRuntimeMinutes, 0);
  const fitsCount = results.filter((r) => r.fitsInTime).length;
  return { totalMinutes, count: results.length, fitsCount };
};
