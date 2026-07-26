const embeddingCache = new Map<string, number[]>();
const MAX_CACHE_SIZE = 10000;

export const getCachedEmbedding = (text: string): number[] | undefined => {
  return embeddingCache.get(text);
};

export const setCachedEmbedding = (text: string, embedding: number[]): void => {
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) {
      embeddingCache.delete(firstKey);
    }
  }
  embeddingCache.set(text, embedding);
};

export const getCacheSize = (): number => embeddingCache.size;

export const clearCache = (): void => {
  embeddingCache.clear();
};
