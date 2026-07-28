"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import SmartFilter from "@/components/SmartFilter";
import FilteredResults from "@/components/FilteredResults";
import ShowDetail from "@/components/ShowDetail";
import Watchlist from "@/components/Watchlist";
import StatsBar from "@/components/StatsBar";
import ChatPanel from "@/components/ChatPanel";
import KnowledgeBase from "@/components/KnowledgeBase";
import { buildShowDetail, buildShowDetailById } from "@/lib/tmdb";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useProgress } from "@/hooks/useProgress";
import { useSmartFilter } from "@/hooks/useSmartFilter";
import type { TMDBSearchResult, ShowDetail as ShowDetailType, WatchlistItem, WatchedItem } from "@/types";
import {
  addToWatched,
  removeFromWatched,
  isWatched as checkIsWatched,
} from "@/lib/localStorage";

export default function Home() {
  const [selectedShow, setSelectedShow] = useState<ShowDetailType | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const watchlist = useWatchlist();
  const progress = useProgress();
  const smartFilter = useSmartFilter();

  const handleSearchSelect = async (result: TMDBSearchResult) => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await buildShowDetail(result);
      setSelectedShow(detail);
    } catch {
      setDetailError("Failed to load show details. Please try again.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleAddToWatchlist = (show: ShowDetailType) => {
    const item: WatchlistItem = {
      id: show.id,
      type: show.type,
      title: show.title,
      posterPath: show.posterPath,
      totalRuntimeMinutes: show.totalRuntimeMinutes,
      addedAt: Date.now(),
      genres: show.genres,
      providers: show.streamingProviders.map((p) => p.name),
      rating: show.rating,
      year: show.year,
    };
    watchlist.add(item);
  };

  const handleRemoveFromWatchlist = (id: number) => {
    watchlist.remove(id);
  };

  const handleToggleWatched = (show: ShowDetailType) => {
    if (checkIsWatched(show.id)) {
      removeFromWatched(show.id);
    } else {
      const item: WatchedItem = {
        id: show.id,
        type: show.type,
        title: show.title,
        posterPath: show.posterPath,
        totalRuntimeMinutes: show.totalRuntimeMinutes,
        watchedAt: Date.now(),
      };
      addToWatched(item);
    }
  };

  const handleAdvanceEpisode = () => {
    if (selectedShow) {
      progress.advanceEpisode(selectedShow.id);
    }
  };

  const handleResetProgress = () => {
    if (selectedShow) {
      progress.remove(selectedShow.id);
    }
  };

  const handleFilterSelect = async (id: number, type: "tv" | "movie") => {
    setIsLoadingDetail(true);
    setDetailError(null);
    try {
      const detail = await buildShowDetailById(id, type);
      setSelectedShow(detail);
    } catch {
      setDetailError("Failed to load show details. Please try again.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const resultCount = smartFilter.watchlistResults.length + smartFilter.discoveryResults.length;

  return (
    <div className="min-h-screen relative">
      <div className="max-w-[1100px] mx-auto px-4 py-10 md:py-14">
        {/* Board Header — the split-flap PLOT title */}
        <div className="mb-10">
          <div className="flex items-center gap-1 mb-3">
            {"PLOT".split("").map((char, i) => (
              <span
                key={i}
                className="flap-char text-4xl md:text-5xl w-12 h-16 md:w-14 md:h-[72px]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {char}
              </span>
            ))}
          </div>
          <p className="text-steel-dark text-sm uppercase tracking-[0.2em] font-[family-name:var(--font-board)]">
            Departure board for your evening
          </p>
        </div>

        {/* Search — station information desk */}
        <div className="mb-8">
          <SearchBar onSelect={handleSearchSelect} />
        </div>

        {/* Smart Filter — board column controls */}
        <SmartFilter
          timeBudget={smartFilter.criteria.timeBudget}
          selectedServices={smartFilter.criteria.services}
          selectedGenres={smartFilter.criteria.genres}
          isFilterActive={smartFilter.isFilterActive}
          isLoading={smartFilter.isLoading}
          onTimeBudgetChange={smartFilter.setTimeBudget}
          onServiceToggle={smartFilter.toggleService}
          onGenreToggle={smartFilter.toggleGenre}
          onReset={smartFilter.resetFilter}
          resultCount={resultCount}
          watchlistCount={watchlist.items.length}
        />

        {/* Filtered Results — departure rows */}
        {smartFilter.isFilterActive && (
          <div className="mb-10">
            <FilteredResults
              watchlistItems={smartFilter.watchlistResults}
              discoveryItems={smartFilter.discoveryResults}
              timeMaxMinutes={smartFilter.timeMaxMinutes}
              onSelect={handleFilterSelect}
              isLoading={smartFilter.isLoading}
            />
          </div>
        )}

        {/* Watchlist — booked departures */}
        {watchlist.items.length > 0 && (
          <div className="mt-10">
            <StatsBar totalMinutes={watchlist.totalMinutes} count={watchlist.items.length} />
            <Watchlist items={watchlist.items} onRemove={handleRemoveFromWatchlist} />
          </div>
        )}

        {/* Bottom Section */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <ChatPanel />
          <KnowledgeBase />
        </div>
      </div>

      {/* Loading State */}
      {isLoadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-flap-black/90">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1">
              {["L","O","A","D","I","N","G"].map((char, i) => (
                <span
                  key={i}
                  className="flap-char text-xl w-8 h-10 flap-animate"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {char}
                </span>
              ))}
            </div>
            <p className="text-steel-dark text-sm uppercase tracking-wider font-[family-name:var(--font-board)]">
              Fetching departure
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {detailError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-flap-black border border-cancelled-red/50">
          <p className="status-over-time text-sm">{detailError}</p>
        </div>
      )}

      {/* Show Detail Modal */}
      {selectedShow && !isLoadingDetail && (
        <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center">
          <div
            className="absolute inset-0 bg-flap-black/90"
            onClick={() => setSelectedShow(null)}
          />
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 mb-0 md:mb-0 md:rounded-none">
            <ShowDetail
              show={selectedShow}
              isInWatchlist={watchlist.isInList(selectedShow.id)}
              isWatched={checkIsWatched(selectedShow.id)}
              onAdd={handleAddToWatchlist}
              onRemove={handleRemoveFromWatchlist}
              onToggleWatched={handleToggleWatched}
              progress={progress.getForShow(selectedShow.id)}
              onAdvanceEpisode={handleAdvanceEpisode}
              onResetProgress={handleResetProgress}
              onClose={() => setSelectedShow(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
