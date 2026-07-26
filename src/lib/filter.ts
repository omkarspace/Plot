import type { FilterCriteria, FilterResult, WatchlistItem } from "@/types";
import { getAllServices } from "./services";

const TIME_BUDGET_MINUTES: Record<string, number> = {
  "30min": 30,
  "1hr": 60,
  "2hr": 120,
  all: Infinity,
};

// Build a lookup: service ID → provider name (lowercase) for matching
const buildServiceNameMap = (): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  for (const service of getAllServices()) {
    map.set(service.id, [service.name.toLowerCase()]);
  }
  return map;
};

export const filterWatchlist = (
  criteria: FilterCriteria,
  items: WatchlistItem[]
): FilterResult[] => {
  const maxMinutes = TIME_BUDGET_MINUTES[criteria.timeBudget] || Infinity;
  const serviceNameMap = buildServiceNameMap();

  const results: FilterResult[] = items.map((item) => {
    const typeMatch = criteria.type === "all" || item.type === criteria.type;

    // Service matching: check if item's providers overlap with user's services
    let serviceMatch = true;
    let availableOn: string[] = [];
    if (criteria.services.length > 0) {
      const itemProviders = (item.providers ?? []).map((p) => p.toLowerCase());
      availableOn = criteria.services.filter((serviceId) => {
        const names = serviceNameMap.get(serviceId) ?? [serviceId];
        return names.some((name) => itemProviders.includes(name));
      });
      serviceMatch = availableOn.length > 0;
    }

    // Genre matching: check if item's genres overlap with selected mood genres
    let genreMatch = true;
    if (criteria.genres.length > 0) {
      const itemGenres = (item.genres ?? []).map((g) => g.toLowerCase());
      genreMatch = criteria.genres.some((g) => itemGenres.includes(g.toLowerCase()));
    }

    const fitsInTime = item.totalRuntimeMinutes <= maxMinutes;

    let matchScore = 0;
    if (typeMatch) matchScore += 25;
    if (serviceMatch) matchScore += 25;
    if (genreMatch) matchScore += 25;
    if (fitsInTime) matchScore += 25;

    return { item, fitsInTime, availableOn, matchScore };
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
