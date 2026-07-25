import type { WatchlistItem } from "@/types";

const STORAGE_KEY = "plot-watchlist";

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
