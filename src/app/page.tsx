/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import SmartFilter from "@/components/SmartFilter";
import FilteredResults from "@/components/FilteredResults";
import ShowDetail from "@/components/ShowDetail";
import Watchlist from "@/components/Watchlist";
import WatchedSection from "@/components/WatchedSection";
import StatsBar from "@/components/StatsBar";
import EmptyState from "@/components/EmptyState";
import { buildShowDetail, buildShowDetailById } from "@/lib/tmdb";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useProgress } from "@/hooks/useProgress";
import { useSmartFilter } from "@/hooks/useSmartFilter";
import type { TMDBSearchResult, ShowDetail as ShowDetailType, WatchlistItem, WatchedItem } from "@/types";
import {
  getWatched as getStoredWatched,
  addToWatched,
  removeFromWatched,
  isWatched as checkIsWatched,
} from "@/lib/localStorage";

export default function Home() {
  const [selectedShow, setSelectedShow] = useState<ShowDetailType | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [watchedItems, setWatchedItems] = useState<WatchedItem[]>([]);

  const watchlist = useWatchlist();
  const progress = useProgress();
  const smartFilter = useSmartFilter();

  const refreshWatched = useCallback(() => {
    setWatchedItems(getStoredWatched());
  }, []);

  useEffect(() => {
    refreshWatched();
  }, [refreshWatched]);

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
    smartFilter.refreshWatchlist();
  };

  const handleRemoveFromWatchlist = (id: number) => {
    watchlist.remove(id);
    smartFilter.refreshWatchlist();
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
    refreshWatched();
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

  const handleFilterSelect = async (id: number) => {
    const item = watchlist.items.find((w) => w.id === id);
    if (item) {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const detail = await buildShowDetailById(item.id, item.type);
        setSelectedShow(detail);
      } catch {
        setDetailError("Failed to load show details. Please try again.");
      } finally {
        setIsLoadingDetail(false);
      }
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Plot</h1>
          <p className="text-[#737373]">
            Stop scrolling. Start watching.
          </p>
        </div>

        <SmartFilter
          timeBudget={smartFilter.criteria.timeBudget}
          selectedServices={smartFilter.criteria.services}
          selectedGenres={smartFilter.criteria.genres}
          isFilterActive={smartFilter.isFilterActive}
          onTimeBudgetChange={smartFilter.setTimeBudget}
          onServiceToggle={smartFilter.toggleService}
          onGenreToggle={smartFilter.toggleGenre}
          onReset={smartFilter.resetFilter}
          resultCount={smartFilter.results.length}
        />

        {smartFilter.isFilterActive && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold text-white mb-4">Your matches</h3>
            <FilteredResults
              results={smartFilter.results}
              onSelect={handleFilterSelect}
              onAddToWatchlist={() => {}}
            />
          </div>
        )}

        <div className="mb-8">
          <SearchBar onSelect={handleSearchSelect} />
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
          <div className="mb-10">
            <ShowDetail
              show={selectedShow}
              isInWatchlist={watchlist.isInList(selectedShow.id)}
              isWatched={checkIsWatched(selectedShow.id)}
              onAdd={handleAddToWatchlist}
              onToggleWatched={handleToggleWatched}
              progress={progress.getForShow(selectedShow.id)}
              onAdvanceEpisode={handleAdvanceEpisode}
              onResetProgress={handleResetProgress}
            />
          </div>
        )}

        <div className="mt-10">
          <StatsBar totalMinutes={watchlist.totalMinutes} count={watchlist.items.length} />
          {watchlist.items.length > 0 ? (
            <Watchlist items={watchlist.items} onRemove={handleRemoveFromWatchlist} />
          ) : (
            <EmptyState type="watchlist" />
          )}
        </div>

        {watchedItems.length > 0 && (
          <>
            <div className="border-t border-[#262626] my-10" />
            <WatchedSection items={watchedItems} onRemove={(id) => { removeFromWatched(id); refreshWatched(); }} />
          </>
        )}
      </div>
    </main>
  );
}
