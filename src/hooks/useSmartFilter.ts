"use client";

import { useState, useMemo } from "react";
import type { FilterCriteria, TimeBudget, FilterResult, WatchlistItem } from "@/types";
import { filterWatchlist } from "@/lib/filter";
import { getWatchlist } from "@/lib/localStorage";

const DEFAULT_CRITERIA: FilterCriteria = {
  timeBudget: "2hr",
  services: [],
  genres: [],
  type: "all",
};

export const useSmartFilter = () => {
  const [criteria, setCriteria] = useState<FilterCriteria>(DEFAULT_CRITERIA);
  const [isFilterActive, setIsFilterActive] = useState(false);

  const watchlist = useMemo(() => getWatchlist(), []);

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
    setCriteria(DEFAULT_CRITERIA);
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
  };
};
