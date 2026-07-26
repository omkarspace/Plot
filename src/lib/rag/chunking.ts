import type { TextChunk } from "@/types/rag";
import type { WatchlistItem } from "@/types";

let chunkCounter = 0;

const makeChunkId = (showId: number, field: string): string => {
  chunkCounter++;
  return `${showId}-${field}-${chunkCounter}`;
};

export const chunkShow = (
  show: WatchlistItem
): TextChunk[] => {
  const chunks: TextChunk[] = [];

  if (show.genres && show.genres.length > 0) {
    chunks.push({
      id: makeChunkId(show.id, "genres"),
      content: `${show.title} is a ${show.type === "tv" ? "TV show" : "movie"} in the genres: ${show.genres.join(", ")}.`,
      metadata: {
        showId: show.id,
        type: show.type,
        title: show.title,
        field: "genres",
        posterPath: show.posterPath,
      },
    });
  }

  if (show.providers && show.providers.length > 0) {
    chunks.push({
      id: makeChunkId(show.id, "providers"),
      content: `${show.title} is available on: ${show.providers.join(", ")}.`,
      metadata: {
        showId: show.id,
        type: show.type,
        title: show.title,
        field: "providers",
        posterPath: show.posterPath,
      },
    });
  }

  return chunks;
};

export const chunkSearchResult = (
  result: {
    id: number;
    media_type: "tv" | "movie";
    name?: string;
    title?: string;
    overview: string;
    vote_average: number;
    poster_path: string | null;
    genre_ids: number[];
  }
): TextChunk[] => {
  const title = result.name || result.title || "Unknown";
  const chunks: TextChunk[] = [];

  const overview = result.overview || "";
  if (overview) {
    const sentences = overview.split(/(?<=[.!?])\s+/);
    const maxSentencesPerChunk = 3;
    for (let i = 0; i < sentences.length; i += maxSentencesPerChunk) {
      const chunkSentences = sentences.slice(i, i + maxSentencesPerChunk).join(" ");
      chunks.push({
        id: makeChunkId(result.id, `overview-${i}`),
        content: `${title}: ${chunkSentences}`,
        metadata: {
          showId: result.id,
          type: result.media_type,
          title,
          field: "overview",
          posterPath: result.poster_path,
        },
      });
    }
  }

  return chunks;
};

export const chunkDiscoveryItem = (
  item: {
    id: number;
    type: "tv" | "movie";
    title: string;
    overview: string;
    rating: number;
    year: string;
    posterPath: string | null;
  }
): TextChunk[] => {
  const chunks: TextChunk[] = [];

  if (item.overview) {
    const sentences = item.overview.split(/(?<=[.!?])\s+/);
    const maxSentencesPerChunk = 3;
    for (let i = 0; i < sentences.length; i += maxSentencesPerChunk) {
      const chunkSentences = sentences.slice(i, i + maxSentencesPerChunk).join(" ");
      chunks.push({
        id: makeChunkId(item.id, `overview-${i}`),
        content: `${item.title} (${item.year}, rated ${item.rating}/10): ${chunkSentences}`,
        metadata: {
          showId: item.id,
          type: item.type,
          title: item.title,
          field: "overview",
          posterPath: item.posterPath,
        },
      });
    }
  }

  chunks.push({
    id: makeChunkId(item.id, "combined"),
    content: `${item.title} is a ${item.type === "tv" ? "TV series" : "movie"} from ${item.year} with a rating of ${item.rating}/10.`,
    metadata: {
      showId: item.id,
      type: item.type,
      title: item.title,
      field: "combined",
      posterPath: item.posterPath,
    },
  });

  return chunks;
};
