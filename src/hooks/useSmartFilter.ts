"use client";

import { useState, useCallback, useMemo } from "react";
import type { FilterCriteria, TimeBudget, FilterResult } from "@/types";
import { filterWatchlist } from "@/lib/filter";
import { getWatchlist } from "@/lib/localStorage";
import { getUserServices, saveUserServices } from "@/lib/localStorage";

const DEFAULT_CRITERIA: FilterCriteria = {
  timeBudget: "2hr",
  services: [],
  genres: [],
  type: "all",
};

export const useSmartFilter = () => {
  const [criteria, setCriteria] = useState<FilterCriteria>(() => ({
    ...DEFAULT_CRITERIA,
    services: getUserServices(),
  }));
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [watchlistVersion, setWatchlistVersion] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const watchlist = useMemo(() => getWatchlist(), [watchlistVersion]);

  const refreshWatchlist = useCallback(() => {
    setWatchlistVersion((v) => v + 1);
  }, []);

  const results: FilterResult[] = useMemo(() => {
    if (!isFilterActive) return [];
    return filterWatchlist(criteria, watchlist);
  }, [criteria, isFilterActive, watchlist]);

  const setTimeBudget = (budget: TimeBudget) => {
    setCriteria((prev) => ({ ...prev, timeBudget: budget }));
    setIsFilterActive(true);
  };

  const toggleService = (serviceId: string) => {
    setCriteria((prev) => {
      const services = prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId];
      saveUserServices(services);
      return { ...prev, services };
    });
    setIsFilterActive(true);
  };

  const toggleGenre = (genre: string) => {
    setCriteria((prev) => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
    setIsFilterActive(true);
  };

  const setTypeFilter = (type: "all" | "tv" | "movie") => {
    setCriteria((prev) => ({ ...prev, type }));
    setIsFilterActive(true);
  };

  const resetFilter = () => {
    setCriteria({ ...DEFAULT_CRITERIA, services: getUserServices() });
    setIsFilterActive(false);
  };

  return {
    criteria,
    results,
    isFilterActive,
    setTimeBudget,
    toggleService,
    toggleGenre,
    setTypeFilter,
    resetFilter,
    refreshWatchlist,
  };
};
