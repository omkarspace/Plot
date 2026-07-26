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
    <main className="min-h-screen">
      <div className="px-4 py-8 md:py-12 max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Plot</h1>
          <p className="text-[#737373]">
            Stop scrolling. Start watching.
          </p>
        </div>

        <div className="mb-8">
          <SearchBar onSelect={handleSearchSelect} />
        </div>

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

        {watchlist.items.length > 0 && (
          <div className="mt-10">
            <StatsBar totalMinutes={watchlist.totalMinutes} count={watchlist.items.length} />
            <Watchlist items={watchlist.items} onRemove={handleRemoveFromWatchlist} />
          </div>
        )}

        <div className="mt-10 space-y-4">
          <ChatPanel />
          <KnowledgeBase />
        </div>
      </div>

      {isLoadingDetail && (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#737373] mt-4">Loading show details...</p>
        </div>
      )}

      {detailError && (
        <div className="text-center py-12">
          <p className="text-red-400">{detailError}</p>
        </div>
      )}

      {selectedShow && !isLoadingDetail && (
        <div className="w-full px-4 pb-10">
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
          />
        </div>
      )}
    </main>
  );
}
