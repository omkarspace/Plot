"use client";

import { useState, useCallback } from "react";
import {
  getProgress as getStoredProgress,
  updateProgress as updateStored,
  removeProgress as removeStored,
  getProgressForShow,
} from "@/lib/localStorage";
import type { ShowProgress } from "@/types";

export const useProgress = () => {
  const [progress, setProgress] = useState<ShowProgress[]>(() => getStoredProgress());

  const refresh = useCallback(() => {
    setProgress(getStoredProgress());
  }, []);

  const getForShow = useCallback((id: number) => getProgressForShow(id), []);

  const update = useCallback(
    (p: ShowProgress) => {
      updateStored(p);
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

  const advanceEpisode = useCallback(
    (showId: number) => {
      const existing = getProgressForShow(showId);
      if (!existing || existing.type !== "tv") return;

      const updated: ShowProgress = {
        ...existing,
        currentEpisode: (existing.currentEpisode || 1) + 1,
        lastWatchedAt: Date.now(),
      };

      update(updated);
    },
    [update]
  );

  const markMovieWatched = useCallback(
    (showId: number) => {
      const existing = getProgressForShow(showId);
      if (!existing || existing.type !== "movie") return;
      update({ ...existing, watched: true, lastWatchedAt: Date.now() });
    },
    [update]
  );

  const totalTimeWatched = progress.reduce(
    (sum, p) => sum + (p.totalRuntimeMinutes || 0),
    0
  );

  return {
    progress,
    getForShow,
    update,
    remove,
    advanceEpisode,
    markMovieWatched,
    totalTimeWatched,
    refresh,
  };
};