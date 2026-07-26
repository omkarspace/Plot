import type {
  TMDBSearchResponse,
  TMDBTVDetail,
  TMDBMovieDetail,
  TMDBWatchProviders,
  ShowDetail,
  SeasonDetail,
  StreamingProvider,
} from "@/types";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.error("Missing NEXT_PUBLIC_TMDB_API_KEY in .env.local");
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

  let totalMinutes = 0;
  for (const season of tvDetail.seasons) {
    if (season.season_number === 0) continue;
    try {
      const seasonDetail = await getSeasonDetail(tvDetail.id, season.season_number);
      for (const episode of seasonDetail.episodes) {
        totalMinutes += episode.runtime || 0;
      }
    } catch {
      // If we can't get season detail, estimate from episode count
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
    const detail = await getTVDetail(id);
    const totalRuntimeMinutes = await calculateTotalRuntime(detail);

    let providers: StreamingProvider[] = [];
    try {
      const watchData = await getWatchProviders(id, "tv");
      const usProviders = watchData.results?.["US"];
      if (usProviders?.flatrate) {
        providers = usProviders.flatrate.map((p) => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }));
      }
    } catch {
      // Providers not available, continue without
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
    const detail = await getMovieDetail(id);
    const runtime = detail.runtime || 0;
    const totalHours = runtime / 60;
    const totalDays = totalHours / 24;

    let providers: StreamingProvider[] = [];
    try {
      const watchData = await getWatchProviders(id, "movie");
      const usProviders = watchData.results?.["US"];
      if (usProviders?.flatrate) {
        providers = usProviders.flatrate.map((p) => ({
          name: p.provider_name,
          logoPath: p.logo_path,
        }));
      }
    } catch {
      // Providers not available, continue without
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
