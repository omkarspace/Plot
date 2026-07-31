"use client";

import { useState, useEffect } from "react";
import type { FilterCriteria, TimeBudget, DiscoveryItem } from "@/types";
import { getWatchlist, getUserServices, saveUserServices } from "@/lib/localStorage";

const DEFAULT_CRITERIA: FilterCriteria = {
  timeBudget: "2hr",
  services: [],
  genres: [],
  type: "all",
};

interface DiscoverAPIResponse {
  results: DiscoveryItem[];
  region: string;
}

/* eslint-disable react-hooks/set-state-in-effect */
export const useSmartFilter = () => {
  const [criteria, setCriteria] = useState<FilterCriteria>(DEFAULT_CRITERIA);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<DiscoveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedServices = getUserServices();
    setCriteria((prev) => ({ ...prev, services: savedServices }));
  }, []);

  // When filter changes, fetch from TMDB via API route
  useEffect(() => {
    if (!isFilterActive) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      if (criteria.services.length === 0 && criteria.genres.length === 0) return;
      setIsLoading(true);
      try {
        const response = await fetch("/api/tmdb/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceIds: criteria.services,
            moodIds: criteria.genres,
            timeBudget: criteria.timeBudget === "all" ? null : parseInt(criteria.timeBudget) * 60,
            region: "US",
          }),
        });
        if (!response.ok) throw new Error("Discover failed");
        const data: DiscoverAPIResponse = await response.json();
        if (!cancelled) {
          setDiscoveryResults(data.results);
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
  }, [isFilterActive, criteria.services, criteria.genres, criteria.timeBudget]);

  const filteredWatchlist = isFilterActive
    ? getWatchlist().filter((item) => {
        if (criteria.type !== "all" && item.type !== criteria.type) return false;
        if (criteria.genres.length > 0) {
          const itemGenres = (item.genres ?? []).map((g) => g.toLowerCase());
          if (!criteria.genres.some((g) => itemGenres.includes(g.toLowerCase()))) return false;
        }
        return true;
      })
    : [];

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
