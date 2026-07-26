import type { VectorEntry, SearchResult, TextChunk } from "@/types/rag";

let store: VectorEntry[] = [];

export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
};

export const addVectors = (entries: VectorEntry[]): void => {
  store.push(...entries);
};

export const searchVectors = (
  queryEmbedding: number[],
  topK: number = 5
): SearchResult[] => {
  const scored = store.map((entry) => ({
    chunk: entry.chunk,
    score: cosineSimilarity(queryEmbedding, entry.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
};

export const getStoreSize = (): number => store.length;

export const clearStore = (): void => {
  store = [];
};

export const getAllChunks = (): TextChunk[] => store.map((e) => e.chunk);

export const getUniqueShows = (): Map<number, { title: string; type: string; posterPath: string | null }> => {
  const shows = new Map<number, { title: string; type: string; posterPath: string | null }>();
  for (const entry of store) {
    const { showId, title, type, posterPath } = entry.chunk.metadata;
    if (!shows.has(showId)) {
      shows.set(showId, { title, type, posterPath });
    }
  }
  return shows;
};

export const removeShow = (showId: number): void => {
  store = store.filter((e) => e.chunk.metadata.showId !== showId);
};

export const hasShow = (showId: number): boolean => {
  return store.some((e) => e.chunk.metadata.showId === showId);
};

export const getChunksByShow = (showId: number): TextChunk[] => {
  return store.filter((e) => e.chunk.metadata.showId === showId).map((e) => e.chunk);
};
