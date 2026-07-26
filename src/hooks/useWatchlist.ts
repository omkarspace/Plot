"use client";

import { useState, useCallback } from "react";
import {
  getWatchlist as getStoredWatchlist,
  addToWatchlist as addStored,
  removeFromWatchlist as removeStored,
  isInWatchlist as checkInWatchlist,
} from "@/lib/localStorage";
import type { WatchlistItem } from "@/types";

export const useWatchlist = () => {
  const [items, setItems] = useState<WatchlistItem[]>(() => getStoredWatchlist());

  const refresh = useCallback(() => {
    setItems(getStoredWatchlist());
  }, []);

  const add = useCallback(
    (item: WatchlistItem) => {
      addStored(item);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: number) => {
      removeStored(id);
      refresh();
    },
    [refresh]
  );

  const isInList = useCallback((id: number) => checkInWatchlist(id), []);

  const totalMinutes = items.reduce((sum, item) => sum + item.totalRuntimeMinutes, 0);

  return { items, add, remove, isInList, totalMinutes, refresh };
};