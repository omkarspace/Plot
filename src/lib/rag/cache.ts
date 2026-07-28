const embeddingCache = new Map<string, number[]>();
const accessOrder: string[] = [];
const MAX_CACHE_SIZE = 10000;

export const getCachedEmbedding = (text: string): number[] | undefined => {
  const val = embeddingCache.get(text);
  if (val !== undefined) {
    // Move to end (most recently used)
    const idx = accessOrder.indexOf(text);
    if (idx !== -1) accessOrder.splice(idx, 1);
    accessOrder.push(text);
  }
  return val;
};

export const setCachedEmbedding = (text: string, embedding: number[]): void => {
  if (!embeddingCache.has(text) && embeddingCache.size >= MAX_CACHE_SIZE) {
    // Evict least recently used
    const lruKey = accessOrder.shift();
    if (lruKey !== undefined) {
      embeddingCache.delete(lruKey);
    }
  }

  if (!embeddingCache.has(text)) {
    accessOrder.push(text);
  }
  embeddingCache.set(text, embedding);
};

export const getCacheSize = (): number => embeddingCache.size;

export const clearCache = (): void => {
  embeddingCache.clear();
  accessOrder.length = 0;
};
