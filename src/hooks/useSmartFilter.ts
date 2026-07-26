"use client";

import { useState, useEffect } from "react";
import type { FilterCriteria, TimeBudget, DiscoveryItem } from "@/types";
import { discoverContent } from "@/lib/tmdb";
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
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // When filter changes, fetch from TMDB
  useEffect(() => {
    if (!isFilterActive) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (criteria.services.length === 0 && criteria.genres.length === 0) return;
      setIsLoading(true);
      try {
        const results = await discoverContent(criteria.services, criteria.genres);
        if (!cancelled) {
          setDiscoveryResults(results);
        }
      } catch {
        if (!cancelled) {
          setDiscoveryResults([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isFilterActive, criteria.services, criteria.genres]);

  // Also filter local watchlist items
  const watchlist = getWatchlist();
  const filteredWatchlist = isFilterActive
    ? watchlist.filter((item) => {
        if (criteria.type !== "all" && item.type !== criteria.type) return false;
        if (criteria.genres.length > 0) {
          const itemGenres = (item.genres ?? []).map((g) => g.toLowerCase());
          if (!criteria.genres.some((g) => itemGenres.includes(g.toLowerCase()))) return false;
        }
        return true;
      })
    : [];

  // Merge: watchlist items first, then discovery results (deduplicated by id)
  const seenIds = new Set(filteredWatchlist.map((w) => w.id));
  const uniqueDiscovery = discoveryResults.filter((d) => !seenIds.has(d.id));

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
    setDiscoveryResults([]);
    setIsLoading(false);
  };

  // Apply time budget filtering to results
  const TIME_MAX_MINUTES: Record<string, number> = {
    "30min": 30,
    "1hr": 60,
    "2hr": 120,
    all: Infinity,
  };

  const typeFilter = criteria.type;

  const filteredDiscovery = uniqueDiscovery.filter((item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    return true;
  });

  return {
    criteria,
    discoveryResults: filteredDiscovery,
    watchlistResults: filteredWatchlist,
    isFilterActive,
    isLoading,
    timeMaxMinutes: TIME_MAX_MINUTES[criteria.timeBudget] || Infinity,
    setTimeBudget,
    toggleService,
    toggleGenre,
    setTypeFilter,
    resetFilter,
  };
};
