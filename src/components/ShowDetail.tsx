"use client";

import { useState } from "react";
import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime, formatDaysHours, calculateBingeTime } from "@/lib/time";
import ProgressTracker from "./ProgressTracker";
import type { ShowDetail as ShowDetailType, ShowProgress } from "@/types";

interface ShowDetailProps {
  show: ShowDetailType;
  isInWatchlist: boolean;
  isWatched: boolean;
  onAdd: (show: ShowDetailType) => void;
  onRemove?: (id: number) => void;
  onToggleWatched: (show: ShowDetailType) => void;
  progress?: ShowProgress;
  onAdvanceEpisode?: () => void;
  onResetProgress?: () => void;
  onClose?: () => void;
}

export default function ShowDetail({
  show,
  isInWatchlist,
  isWatched,
  onAdd,
  onRemove = () => {},
  onToggleWatched,
  progress,
  onAdvanceEpisode = () => {},
  onResetProgress = () => {},
  onClose = () => {},
}: ShowDetailProps) {
  const [added, setAdded] = useState(false);
  const [showSeasons, setShowSeasons] = useState(false);
  const [episodesPerDay, setEpisodesPerDay] = useState(2);

  const bingeTime =
    show.type === "tv" && show.episodes && show.episodeRuntime
      ? calculateBingeTime(show.episodes, show.episodeRuntime, episodesPerDay)
      : null;

  const handleAdd = () => {
    onAdd(show);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const runtimeDisplay =
    show.type === "tv"
      ? `${show.seasons} seasons · ${show.episodes} eps · ${show.episodeRuntime || "?"}min`
      : formatRuntime(show.totalRuntimeMinutes);

  return (
    <div className="bg-flap-black border border-ruled relative">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 bg-flap-shadow border border-ruled flex items-center justify-center hover:bg-flap-black hover:border-steel-dark transition-colors"
      >
        <span className="text-steel-frame text-xs font-[family-name:var(--font-board)]">X</span>
      </button>

      {/* Backdrop */}
      {show.backdropPath && (
        <div className="relative h-48 md:h-64 overflow-hidden">
          <Image
            src={getImageUrl(show.backdropPath, "w780")}
            alt={show.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 780px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-flap-black via-flap-black/60 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 md:p-8 -mt-16 relative">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <Image
            src={getImageUrl(show.posterPath, "w342")}
            alt={show.title}
            width={114}
            height={171}
            className="flex-shrink-0 mx-auto md:mx-0 border border-ruled"
          />

          {/* Details */}
          <div className="flex-1 min-w-0 text-center md:text-left">
            {/* Title as flap characters */}
            <div className="flex gap-[2px] justify-center md:justify-start mb-3 flex-wrap">
              {show.title.toUpperCase().slice(0, 20).split("").map((char, i) => (
                <span
                  key={i}
                  className="flap-char text-lg md:text-xl w-7 h-9"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </div>

            <p className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)] mb-4">
              {show.type === "tv" ? "TV Series" : "Feature Film"} · {show.year}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 justify-center md:justify-start mb-5">
              <span className="text-delay-amber font-[family-name:var(--font-mono)] text-lg font-bold">
                ★ {show.rating.toFixed(1)}
              </span>
              <span className="text-steel-dark text-xs font-[family-name:var(--font-mono)]">/10</span>
            </div>

            {/* Stats — ruled rows */}
            <div className="border border-ruled mb-5">
              <div className="flex border-b border-ruled">
                <div className="flex-1 px-4 py-3 border-r border-ruled">
                  <span className="text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block">
                    Runtime
                  </span>
                  <span className="text-flap-white text-sm font-[family-name:var(--font-mono)] font-medium">
                    {runtimeDisplay}
                  </span>
                </div>
                <div className="flex-1 px-4 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block">
                    Total
                  </span>
                  <span className="text-flap-white text-sm font-[family-name:var(--font-mono)] font-medium">
                    {formatDaysHours(show.totalRuntimeMinutes)}
                  </span>
                </div>
              </div>
              {show.type === "tv" && bingeTime && (
                <div className="px-4 py-3">
                  <span className="text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block mb-2">
                    Binge Speed — {episodesPerDay} ep/day
                  </span>
                  <span className="text-delay-amber text-sm font-[family-name:var(--font-mono)] font-bold block mb-3">
                    {bingeTime.days} days ({bingeTime.hours}h total)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-steel-dark text-[10px] font-[family-name:var(--font-mono)]">1</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={episodesPerDay}
                      onChange={(e) => setEpisodesPerDay(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-steel-dark text-[10px] font-[family-name:var(--font-mono)]">10</span>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Tracking */}
            {show.type === "tv" && show.seasons && show.episodes && (
              <div className="mb-5">
                <ProgressTracker
                  progress={progress}
                  totalSeasons={show.seasons}
                  totalEpisodes={show.episodes}
                  onAdvance={onAdvanceEpisode}
                  onReset={onResetProgress}
                />
              </div>
            )}

            {/* Genres — as flap tags */}
            <div className="flex flex-wrap gap-1 mb-5 justify-center md:justify-start">
              {show.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 bg-flap-shadow border border-ruled text-[10px] uppercase tracking-wider text-steel-frame font-[family-name:var(--font-board)]"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Streaming Providers */}
            {show.streamingProviders.length > 0 && (
              <div className="mb-5">
                <span className="text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)] block mb-2">
                  Stream On
                </span>
                <div className="flex flex-wrap gap-1 justify-center md:justify-start">
                  {show.streamingProviders.map((provider) => (
                    <span
                      key={provider.name}
                      className="px-3 py-1.5 bg-delay-amber/10 text-delay-amber text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium border border-delay-amber/20"
                    >
                      {provider.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Season Breakdown */}
            {show.type === "tv" && show.seasonDetails && show.seasonDetails.length > 0 && (
              <div className="mb-5">
                <button
                  onClick={() => setShowSeasons(!showSeasons)}
                  className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)] hover:text-delay-amber transition-colors flex items-center gap-2 mx-auto md:mx-0"
                >
                  {showSeasons ? "Hide" : "Show"} Season Breakdown
                  <span className={`transition-transform ${showSeasons ? "rotate-90" : ""}`}>→</span>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: showSeasons ? `${show.seasonDetails.length * 40 + 40}px` : "0" }}
                >
                  <div className="mt-3 border border-ruled">
                    <div className="grid grid-cols-[60px_1fr_70px_50px] gap-0 px-3 py-2 border-b border-ruled bg-board-surface text-[10px] uppercase tracking-wider text-steel-dark font-[family-name:var(--font-board)]">
                      <span>Season</span>
                      <span>Name</span>
                      <span>Eps</span>
                      <span>Year</span>
                    </div>
                    {show.seasonDetails.map((season, i) => (
                      <div
                        key={season.seasonNumber}
                        className={`grid grid-cols-[60px_1fr_70px_50px] gap-0 px-3 py-2 ${
                          i !== show.seasonDetails!.length - 1 ? "border-b border-ruled" : ""
                        } ${i % 2 === 1 ? "bg-row-alt" : ""}`}
                      >
                        <span className="text-flap-white text-sm font-[family-name:var(--font-mono)]">
                          S{String(season.seasonNumber).padStart(2, "0")}
                        </span>
                        <span className="text-flap-white text-sm uppercase font-[family-name:var(--font-board)] truncate">
                          {season.name}
                        </span>
                        <span className="text-steel-frame text-sm font-[family-name:var(--font-mono)]">
                          {season.episodeCount}
                        </span>
                        <span className="text-steel-dark text-sm font-[family-name:var(--font-mono)]">
                          {season.airDate ? season.airDate.split("-")[0] : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Overview */}
            {show.overview && (
              <p className="text-steel-frame text-sm leading-relaxed mb-5 line-clamp-3 font-[family-name:var(--font-board)]">
                {show.overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {isInWatchlist ? (
                <button
                  onClick={() => onRemove(show.id)}
                  className="px-6 py-3 bg-cancelled-red/10 text-cancelled-red border border-cancelled-red/30 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold hover:bg-cancelled-red/20 transition-colors"
                >
                  Remove Booking
                </button>
              ) : (
                <button
                  onClick={handleAdd}
                  disabled={added}
                  className={`px-6 py-3 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold transition-colors ${
                    added
                      ? "bg-delay-amber/10 text-delay-amber border border-delay-amber/30 cursor-default"
                      : "bg-delay-amber text-flap-black hover:bg-delay-amber/90"
                  }`}
                >
                  {added ? "✓ Booked" : "Book Departure →"}
                </button>
              )}
              <button
                onClick={() => onToggleWatched(show)}
                className={`px-6 py-3 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold transition-colors ${
                  isWatched
                    ? "bg-delay-amber text-flap-black"
                    : "border border-ruled text-steel-frame hover:border-delay-amber hover:text-delay-amber"
                }`}
              >
                {isWatched ? "✓ Completed" : "Mark Complete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
