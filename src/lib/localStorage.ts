import type { WatchlistItem, WatchedItem, SearchHistoryItem, ShowProgress } from "@/types";

const STORAGE_KEY = "plot-watchlist";
const WATCHED_KEY = "plot-watched";

export const getWatchlist = (): WatchlistItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToWatchlist = (item: WatchlistItem): void => {
  const watchlist = getWatchlist();
  if (!watchlist.some((w) => w.id === item.id)) {
    watchlist.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }
};

export const removeFromWatchlist = (id: number): void => {
  const watchlist = getWatchlist().filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
};

export const isInWatchlist = (id: number): boolean => {
  return getWatchlist().some((w) => w.id === id);
};

export const getWatched = (): WatchedItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(WATCHED_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToWatched = (item: WatchedItem): void => {
  const watched = getWatched();
  if (!watched.some((w) => w.id === item.id)) {
    watched.push(item);
    localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
  }
};

export const removeFromWatched = (id: number): void => {
  const watched = getWatched().filter((w) => w.id !== id);
  localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
};

export const isWatched = (id: number): boolean => {
  return getWatched().some((w) => w.id === id);
};

const HISTORY_KEY = "plot-search-history";
const MAX_HISTORY = 10;

export const getSearchHistory = (): SearchHistoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const addToSearchHistory = (item: Omit<SearchHistoryItem, "timestamp">): void => {
  const history = getSearchHistory().filter(h => h.id !== item.id);
  history.unshift({ ...item, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.pop();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

export const clearSearchHistory = (): void => {
  localStorage.removeItem(HISTORY_KEY);
};

// === Progress Tracking ===

const PROGRESS_KEY = "plot-progress";

export const getProgress = (): ShowProgress[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

export const getProgressForShow = (id: number): ShowProgress | undefined => {
  return getProgress().find((p) => p.id === id);
};

export const updateProgress = (progress: ShowProgress): void => {
  const all = getProgress().filter((p) => p.id !== progress.id);
  all.push(progress);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
};

export const removeProgress = (id: number): void => {
  const all = getProgress().filter((p) => p.id !== id);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
};

// === User Services ===

const SERVICES_KEY = "plot-services";

export const getUserServices = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.services || [];
  } catch {
    return [];
  }
};

export const saveUserServices = (serviceIds: string[]): void => {
  localStorage.setItem(
    SERVICES_KEY,
    JSON.stringify({ services: serviceIds, updatedAt: Date.now() })
  );
};
