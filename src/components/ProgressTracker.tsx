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
    <div className="border border-ruled">
      <div className="flex items-center justify-between px-4 py-2 border-b border-ruled bg-board-surface">
        <span className="text-[10px] uppercase tracking-[0.2em] text-steel-dark font-[family-name:var(--font-board)]">
          Progress
        </span>
        <button
          onClick={onReset}
          className="text-steel-dark text-[10px] uppercase tracking-wider hover:text-cancelled-red transition-colors font-[family-name:var(--font-board)]"
        >
          Reset
        </button>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          {/* Current episode as flap characters */}
          <div className="flex gap-[2px]">
            {`S${String(currentSeason).padStart(2, "0")}E${String(currentEpisode).padStart(2, "0")}`.split("").map((char, i) => (
              <span key={i} className="flap-char text-lg w-7 h-9">
                {char}
              </span>
            ))}
          </div>
          <div className="flex-1">
            <div className="h-1.5 bg-flap-shadow overflow-hidden">
              <div
                className="h-full bg-delay-amber transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-steel-dark text-[10px] font-[family-name:var(--font-mono)] mt-1.5">
              {percentage}% · {watchedEp}/{totalEp} episodes
            </p>
          </div>
        </div>
        <button
          onClick={onAdvance}
          className="w-full py-2.5 bg-delay-amber text-flap-black text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold hover:bg-delay-amber/90 transition-colors"
        >
          Mark Watched · S{String(currentSeason).padStart(2, "0")}E{String(currentEpisode).padStart(2, "0")} →
        </button>
      </div>
    </div>
  );
}
