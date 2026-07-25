"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import ShowDetail from "@/components/ShowDetail";
import Watchlist from "@/components/Watchlist";
import WatchedSection from "@/components/WatchedSection";
import StatsBar from "@/components/StatsBar";
import { buildShowDetail } from "@/lib/tmdb";
import {
  getWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
  getWatched, addToWatched, removeFromWatched, isWatched,
} from "@/lib/localStorage";
import type { TMDBSearchResult, ShowDetail as ShowDetailType, WatchlistItem, WatchedItem } from "@/types";

export default function Home() {
  const [selectedShow, setSelectedShow] = useState<ShowDetailType | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => getWatchlist());
  const [watched, setWatched] = useState<WatchedItem[]>(() => getWatched());
  const [detailError, setDetailError] = useState<string | null>(null);

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
    };
    addToWatchlist(item);
    setWatchlist(getWatchlist());
  };

  const handleRemoveFromWatchlist = (id: number) => {
    removeFromWatchlist(id);
    setWatchlist(getWatchlist());
  };

  const handleToggleWatched = (show: ShowDetailType) => {
    if (isWatched(show.id)) {
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
    setWatched(getWatched());
  };

  const handleRemoveFromWatched = (id: number) => {
    removeFromWatched(id);
    setWatched(getWatched());
  };

  const totalMinutes = watchlist.reduce((sum, item) => sum + item.totalRuntimeMinutes, 0);

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">
            Plot
          </h1>
          <p className="text-[#737373]">
            Track your watch time. Never wonder &ldquo;how long is this again?&rdquo;
          </p>
        </div>

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
              isInWatchlist={isInWatchlist(selectedShow.id)}
              isWatched={isWatched(selectedShow.id)}
              onAdd={handleAddToWatchlist}
              onToggleWatched={handleToggleWatched}
            />
          </div>
        )}

        <div className="mt-10">
          <StatsBar totalMinutes={totalMinutes} count={watchlist.length} />
          <Watchlist items={watchlist} onRemove={handleRemoveFromWatchlist} />
        </div>

        {watched.length > 0 && (
          <>
            <div className="border-t border-[#262626] my-10" />
            <WatchedSection items={watched} onRemove={handleRemoveFromWatched} />
          </>
        )}
      </div>
    </main>
  );
}
