export interface TMDBSearchResult {
  id: number;
  media_type: "tv" | "movie";
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
}

export interface TMDBSearchResponse {
  results: TMDBSearchResult[];
  total_results: number;
  total_pages: number;
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  last_air_date: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TMDBSeason[];
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  status: string;
  type: string;
}

export interface TMDBSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  overview: string;
  poster_path: string | null;
}

export interface TMDBEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  runtime: number | null;
  air_date: string;
  overview: string;
  still_path: string | null;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  runtime: number | null;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { iso_639_1: string; name: string }[];
  status: string;
}

export interface TMDBWatchProviders {
  results: {
    [countryCode: string]: {
      link: string;
      flatrate?: { provider_id: number; provider_name: string; logo_path: string }[];
      rent?: { provider_id: number; provider_name: string; logo_path: string }[];
      buy?: { provider_id: number; provider_name: string; logo_path: string }[];
    };
  };
}

export interface ShowDetail {
  id: number;
  type: "tv" | "movie";
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string;
  rating: number;
  year: string;
  seasons?: number;
  episodes?: number;
  totalRuntimeMinutes: number;
  episodeRuntime?: number;
  genres: string[];
  streamingProviders: StreamingProvider[];
  bingeStats: BingeStats;
}

export interface StreamingProvider {
  name: string;
  logoPath: string;
}

export interface BingeStats {
  totalHours: number;
  totalDays: number;
  episodesPerDay: number;
}

export interface WatchlistItem {
  id: number;
  type: "tv" | "movie";
  title: string;
  posterPath: string | null;
  totalRuntimeMinutes: number;
  addedAt: number;
}
