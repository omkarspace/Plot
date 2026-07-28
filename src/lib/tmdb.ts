import type {
  TMDBSearchResponse,
  TMDBTVDetail,
  TMDBMovieDetail,
  TMDBWatchProviders,
  ShowDetail,
  SeasonDetail,
  StreamingProvider,
  DiscoveryItem,
} from "@/types";
import { getServiceById } from "./services";

const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.error("Missing TMDB_API_KEY in .env.local");
}

export const getImageUrl = (path: string | null, size: string = "w342"): string => {
  if (!path) return "/placeholder-poster.svg";
  return `${IMAGE_BASE}/${size}${path}`;
};

const fetchTMDB = async <T>(endpoint: string, params: Record<string, string> = {}): Promise<T> => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", API_KEY || "");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
};

export const searchShows = async (query: string): Promise<TMDBSearchResponse> => {
  return fetchTMDB<TMDBSearchResponse>("/search/multi", {
    query,
    include_adult: "false",
    language: "en-US",
    page: "1",
  });
};

export const getTVDetail = async (id: number): Promise<TMDBTVDetail> => {
  return fetchTMDB<TMDBTVDetail>(`/tv/${id}`, { language: "en-US" });
};

export const getMovieDetail = async (id: number): Promise<TMDBMovieDetail> => {
  return fetchTMDB<TMDBMovieDetail>(`/movie/${id}`, { language: "en-US" });
};

export const getWatchProviders = async (id: number, type: "tv" | "movie"): Promise<TMDBWatchProviders> => {
  return fetchTMDB<TMDBWatchProviders>(`/${type}/${id}/watch/providers`);
};

export const getSeasonDetail = async (tvId: number, seasonNumber: number) => {
  return fetchTMDB<{ episodes: { runtime: number | null }[] }>(
    `/tv/${tvId}/season/${seasonNumber}`,
    { language: "en-US" }
  );
};

const calculateTotalRuntime = async (tvDetail: TMDBTVDetail): Promise<number> => {
  if (tvDetail.episode_run_time && tvDetail.episode_run_time.length > 0) {
    return tvDetail.episode_run_time[0] * tvDetail.number_of_episodes;
  }

  const nonSpecialSeasons = tvDetail.seasons.filter((s) => s.season_number > 0);

  const seasonResults = await Promise.allSettled(
    nonSpecialSeasons.map((season) => getSeasonDetail(tvDetail.id, season.season_number))
  );

  let totalMinutes = 0;
  for (const result of seasonResults) {
    if (result.status === "fulfilled") {
      for (const episode of result.value.episodes) {
        totalMinutes += episode.runtime || 0;
      }
    }
  }

  if (totalMinutes === 0 && tvDetail.episode_run_time?.[0]) {
    totalMinutes = tvDetail.episode_run_time[0] * tvDetail.number_of_episodes;
  }

  return totalMinutes;
};

export const buildShowDetail = async (
  result: { id: number; media_type: "tv" | "movie" }
): Promise<ShowDetail> => {
  return buildShowDetailById(result.id, result.media_type);
};

export const buildShowDetailById = async (
  id: number,
  type: "tv" | "movie"
): Promise<ShowDetail> => {
  if (type === "tv") {
    const [detail, watchData] = await Promise.all([
      getTVDetail(id),
      getWatchProviders(id, "tv").catch(() => null),
    ]);
    const totalRuntimeMinutes = await calculateTotalRuntime(detail);

    let providers: StreamingProvider[] = [];
    const usProviders = watchData?.results?.["US"];
    if (usProviders?.flatrate) {
      providers = usProviders.flatrate.map((p) => ({
        name: p.provider_name,
        logoPath: p.logo_path,
      }));
    }

    const startYear = detail.first_air_date?.split("-")[0] || "Unknown";
    const endYear = detail.last_air_date?.split("-")[0] || "Present";
    const totalHours = totalRuntimeMinutes / 60;
    const totalDays = totalHours / 24;

    const seasonDetails: SeasonDetail[] = detail.seasons
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        airDate: s.air_date,
        posterPath: s.poster_path,
      }));

    return {
      id: detail.id,
      type: "tv",
      title: detail.name,
      posterPath: detail.poster_path,
      backdropPath: detail.backdrop_path,
      overview: detail.overview,
      rating: detail.vote_average,
      year: `${startYear}–${endYear}`,
      seasons: detail.number_of_seasons,
      episodes: detail.number_of_episodes,
      totalRuntimeMinutes,
      episodeRuntime: detail.episode_run_time?.[0],
      genres: detail.genres.map((g) => g.name),
      streamingProviders: providers,
      bingeStats: {
        totalHours: Math.round(totalHours * 10) / 10,
        totalDays: Math.round(totalDays * 10) / 10,
        episodesPerDay: 2,
      },
      seasonDetails,
    };
  } else {
    const [detail, watchData] = await Promise.all([
      getMovieDetail(id),
      getWatchProviders(id, "movie").catch(() => null),
    ]);
    const runtime = detail.runtime || 0;
    const totalHours = runtime / 60;
    const totalDays = totalHours / 24;

    let providers: StreamingProvider[] = [];
    const usProviders = watchData?.results?.["US"];
    if (usProviders?.flatrate) {
      providers = usProviders.flatrate.map((p) => ({
        name: p.provider_name,
        logoPath: p.logo_path,
      }));
    }

    return {
      id: detail.id,
      type: "movie",
      title: detail.title,
      posterPath: detail.poster_path,
      backdropPath: detail.backdrop_path,
      overview: detail.overview,
      rating: detail.vote_average,
      year: detail.release_date?.split("-")[0] || "Unknown",
      totalRuntimeMinutes: runtime,
      genres: detail.genres.map((g) => g.name),
      streamingProviders: providers,
      bingeStats: {
        totalHours: Math.round(totalHours * 10) / 10,
        totalDays: Math.round(totalDays * 10) / 10,
        episodesPerDay: 1,
      },
    };
  }
};

// === TMDB Discover API ===

// Genre ID mapping: mood filter id → TMDB genre IDs (for both TV and movie)
const MOOD_TO_TV_GENRE: Record<string, string> = {
  action: "10759",
  comedy: "35",
  drama: "18",
  horror: "27",
  "sci-fi": "10765",
  thriller: "9648",
  romance: "10749",
  documentary: "99",
  animation: "16",
  mystery: "9648",
};

const MOOD_TO_MOVIE_GENRE: Record<string, string> = {
  action: "28",
  comedy: "35",
  drama: "18",
  horror: "27",
  "sci-fi": "878",
  thriller: "53",
  romance: "10749",
  documentary: "99",
  animation: "16",
  mystery: "9648",
};

interface TMDBDiscoverResponse {
  results: {
    id: number;
    name?: string;
    title?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    overview: string;
    vote_average: number;
    first_air_date?: string;
    release_date?: string;
    genre_ids: number[];
    media_type?: string;
  }[];
  total_results: number;
  total_pages: number;
}

export const discoverContent = async (
  serviceIds: string[],
  moodIds: string[]
): Promise<DiscoveryItem[]> => {
  // Collect all TMDB provider IDs from selected services
  const providerIds = new Set<number>();
  for (const sid of serviceIds) {
    const service = getServiceById(sid);
    if (service) {
      for (const tid of service.tmdbIds) {
        providerIds.add(tid);
      }
    }
  }

  const providerStr = Array.from(providerIds).join("|");

  // Collect TMDB genre IDs from selected moods
  const tvGenreIds = moodIds
    .map((m) => MOOD_TO_TV_GENRE[m])
    .filter(Boolean)
    .join(",");
  const movieGenreIds = moodIds
    .map((m) => MOOD_TO_MOVIE_GENRE[m])
    .filter(Boolean)
    .join(",");

  const results: DiscoveryItem[] = [];

  // Fetch TV shows
  const tvParams: Record<string, string> = {
    sort_by: "popularity.desc",
    language: "en-US",
    page: "1",
  };
  if (providerStr) tvParams.with_watch_providers = providerStr;
  if (providerStr) tvParams.watch_region = "US";
  if (providerStr) tvParams.with_watch_monetization_types = "flatrate";
  if (tvGenreIds) tvParams.with_genres = tvGenreIds;

  try {
    const tvData = await fetchTMDB<TMDBDiscoverResponse>("/discover/tv", tvParams);
    for (const item of tvData.results.slice(0, 10)) {
      const year = item.first_air_date?.split("-")[0] || "";
      results.push({
        id: item.id,
        type: "tv",
        title: item.name || "Unknown",
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        overview: item.overview,
        rating: item.vote_average,
        year,
      });
    }
  } catch {
    // TV discover failed, continue with movies
  }

  // Fetch movies
  const movieParams: Record<string, string> = {
    sort_by: "popularity.desc",
    language: "en-US",
    page: "1",
  };
  if (providerStr) movieParams.with_watch_providers = providerStr;
  if (providerStr) movieParams.watch_region = "US";
  if (providerStr) movieParams.with_watch_monetization_types = "flatrate";
  if (movieGenreIds) movieParams.with_genres = movieGenreIds;

  try {
    const movieData = await fetchTMDB<TMDBDiscoverResponse>("/discover/movie", movieParams);
    for (const item of movieData.results.slice(0, 10)) {
      const year = item.release_date?.split("-")[0] || "";
      results.push({
        id: item.id,
        type: "movie",
        title: item.title || "Unknown",
        posterPath: item.poster_path,
        backdropPath: item.backdrop_path,
        overview: item.overview,
        rating: item.vote_average,
        year,
      });
    }
  } catch {
    // Movie discover failed
  }

  return results;
};
