"use client";

import { useState } from "react";
import { getImageUrl } from "@/lib/tmdb";
import { formatRuntime, formatDaysHours, calculateBingeTime } from "@/lib/time";
import type { ShowDetail as ShowDetailType } from "@/types";

interface ShowDetailProps {
  show: ShowDetailType;
  isInWatchlist: boolean;
  isWatched: boolean;
  onAdd: (show: ShowDetailType) => void;
  onToggleWatched: (show: ShowDetailType) => void;
}

export default function ShowDetail({ show, isInWatchlist, isWatched, onAdd, onToggleWatched }: ShowDetailProps) {
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
      ? `${show.seasons} seasons · ${show.episodes} episodes · ${show.episodeRuntime || "?"}min each`
      : formatRuntime(show.totalRuntimeMinutes);

  return (
    <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border border-[#262626]">
      {show.backdropPath && (
        <div className="relative h-48 md:h-64">
          <img
            src={getImageUrl(show.backdropPath, "w780")}
            alt={show.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
        </div>
      )}

      <div className="p-6 md:p-8">
        <div className="flex gap-6">
          <img
            src={getImageUrl(show.posterPath, "w342")}
            alt={show.title}
            className="w-28 md:w-36 rounded-xl shadow-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">{show.title}</h2>
            <p className="text-[#737373] mb-3">
              {show.type === "tv" ? "TV Series" : "Movie"} · {show.year}
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-yellow-400 text-lg">★</span>
              <span className="text-white font-semibold">{show.rating.toFixed(1)}</span>
              <span className="text-[#737373]">/10</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <div className="bg-[#0f0f0f] rounded-lg p-3">
                <p className="text-[#737373] text-xs uppercase tracking-wide">Runtime</p>
                <p className="text-white font-semibold">{runtimeDisplay}</p>
              </div>
              <div className="bg-[#0f0f0f] rounded-lg p-3">
                <p className="text-[#737373] text-xs uppercase tracking-wide">Total</p>
                <p className="text-white font-semibold">{formatDaysHours(show.totalRuntimeMinutes)}</p>
              </div>
              {show.type === "tv" && bingeTime && (
                <div className="bg-[#0f0f0f] rounded-lg p-3 col-span-2 md:col-span-3">
                  <p className="text-[#737373] text-xs uppercase tracking-wide mb-2">
                    Binge Speed
                  </p>
                  <p className="text-white font-semibold text-sm mb-3">
                    {episodesPerDay} ep/day — {bingeTime.days} days ({bingeTime.hours}h total)
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[#737373] text-xs whitespace-nowrap">1 ep/day</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={episodesPerDay}
                      onChange={(e) => setEpisodesPerDay(Number(e.target.value))}
                      className="flex-1 h-1.5 bg-[#262626] rounded-full appearance-none cursor-pointer accent-[#3b82f6]"
                    />
                    <span className="text-[#737373] text-xs whitespace-nowrap">10 ep/day</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {show.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-[#262626] rounded-full text-sm text-[#d4d4d4]"
                >
                  {genre}
                </span>
              ))}
            </div>

            {show.streamingProviders.length > 0 && (
              <div className="mb-4">
                <p className="text-[#737373] text-xs uppercase tracking-wide mb-2">
                  Stream on
                </p>
                <div className="flex flex-wrap gap-2">
                  {show.streamingProviders.map((provider) => (
                    <span
                      key={provider.name}
                      className="px-3 py-1.5 bg-[#3b82f6]/20 text-[#3b82f6] rounded-lg text-sm font-medium"
                    >
                      {provider.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {show.type === "tv" && show.seasonDetails && show.seasonDetails.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowSeasons(!showSeasons)}
                  className="text-[#737373] text-xs uppercase tracking-wide hover:text-white transition-colors"
                >
                  {showSeasons ? "Hide Season Breakdown" : "Show Season Breakdown"} {showSeasons ? "▲" : "▼"}
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{ maxHeight: showSeasons ? `${show.seasonDetails.length * 48 + 16}px` : "0" }}
                >
                  <div className="mt-3 bg-[#0f0f0f] rounded-xl overflow-hidden">
                    <div className="hidden md:grid grid-cols-[80px_1fr_100px_80px] gap-2 px-4 py-2 border-b border-[#262626]">
                      <span className="text-[#737373] text-xs uppercase">Season</span>
                      <span className="text-[#737373] text-xs uppercase">Name</span>
                      <span className="text-[#737373] text-xs uppercase">Episodes</span>
                      <span className="text-[#737373] text-xs uppercase">Year</span>
                    </div>
                    {show.seasonDetails.map((season, i) => (
                      <div
                        key={season.seasonNumber}
                        className={`grid md:grid-cols-[80px_1fr_100px_80px] grid-cols-[60px_1fr_80px] gap-2 px-4 py-2.5 ${
                          i % 2 === 0 ? "bg-[#0f0f0f]" : "bg-[#1a1a1a]"
                        } ${i !== show.seasonDetails!.length - 1 ? "border-b border-[#262626]" : ""}`}
                      >
                        <span className="text-white text-sm font-medium">
                          <span className="md:hidden">S</span>{season.seasonNumber}
                        </span>
                        <span className="text-white text-sm truncate">{season.name}</span>
                        <span className="text-[#a3a3a3] text-sm">{season.episodeCount} eps</span>
                        <span className="hidden md:inline text-[#737373] text-sm">
                          {season.airDate ? season.airDate.split("-")[0] : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {show.overview && (
              <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4 line-clamp-3">
                {show.overview}
              </p>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAdd}
                disabled={isInWatchlist}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isInWatchlist || added
                    ? "bg-green-500/20 text-green-400 cursor-default"
                    : "bg-[#3b82f6] hover:bg-[#2563eb] text-white"
                }`}
              >
                {isInWatchlist || added ? "✓ In Watchlist" : "+ Add to Watchlist"}
              </button>
              <button
                onClick={() => onToggleWatched(show)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  isWatched
                    ? "bg-green-500/20 text-green-400 cursor-default"
                    : "border border-[#404040] text-[#a3a3a3] hover:border-green-500/50 hover:text-green-400"
                }`}
              >
                {isWatched ? "✓ Watched" : "Mark as Watched"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
