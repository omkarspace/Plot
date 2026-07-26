"use client";

import type { ShowProgress } from "@/types";

interface ProgressTrackerProps {
  progress: ShowProgress | undefined;
  totalSeasons: number;
  totalEpisodes: number;
  onAdvance: () => void;
  onReset: () => void;
}

export default function ProgressTracker({
  progress,
  totalSeasons,
  totalEpisodes,
  onAdvance,
  onReset,
}: ProgressTrackerProps) {
  const currentSeason = progress?.currentSeason || 1;
  const currentEpisode = progress?.currentEpisode || 1;

  const episodesPerSeason = Math.ceil(totalEpisodes / totalSeasons);
  const totalEp = totalSeasons * episodesPerSeason;
  const watchedEp = (currentSeason - 1) * episodesPerSeason + currentEpisode - 1;
  const percentage = Math.min(Math.round((watchedEp / totalEp) * 100), 100);

  return (
    <div className="bg-[#0f0f0f] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#737373] text-sm uppercase tracking-wide">Progress</p>
        <button
          onClick={onReset}
          className="text-[#525252] text-xs hover:text-[#737373]"
        >
          Reset
        </button>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="text-2xl font-bold text-white">
          S{String(currentSeason).padStart(2, "0")}E{String(currentEpisode).padStart(2, "0")}
        </div>
        <div className="flex-1">
          <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3b82f6] rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[#737373] text-xs mt-1">
            {percentage}% complete · {watchedEp} of {totalEp} episodes
          </p>
        </div>
      </div>

      <button
        onClick={onAdvance}
        className="w-full py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-sm font-medium transition-colors"
      >
        Mark as watched · S{String(currentSeason).padStart(2, "0")}E{String(currentEpisode).padStart(2, "0")}
      </button>
    </div>
  );
}
