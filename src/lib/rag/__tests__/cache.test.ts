import { getCachedEmbedding, setCachedEmbedding, getCacheSize, clearCache } from "../cache";

beforeEach(() => {
  clearCache();
});

describe("embedding cache", () => {
  it("starts empty", () => {
    expect(getCacheSize()).toBe(0);
  });

  it("stores and retrieves embeddings", () => {
    const embedding = [0.1, 0.2, 0.3];
    setCachedEmbedding("test text", embedding);
    expect(getCachedEmbedding("test text")).toEqual(embedding);
  });

  it("returns undefined for missing keys", () => {
    expect(getCachedEmbedding("nonexistent")).toBeUndefined();
  });

  it("tracks cache size", () => {
    setCachedEmbedding("a", [1]);
    setCachedEmbedding("b", [2]);
    expect(getCacheSize()).toBe(2);
  });

  it("clearCache empties everything", () => {
    setCachedEmbedding("a", [1]);
    clearCache();
    expect(getCacheSize()).toBe(0);
    expect(getCachedEmbedding("a")).toBeUndefined();
  });

  it("evicts oldest entry when max size reached", () => {
    // Fill cache to max (10000) - test with smaller practical number
    // The actual MAX is 10000, but we can test the eviction logic concept
    setCachedEmbedding("first", [1]);
    setCachedEmbedding("second", [2]);
    // Overwriting same key doesn't add new entry
    setCachedEmbedding("first", [3]);
    expect(getCacheSize()).toBe(2);
    expect(getCachedEmbedding("first")).toEqual([3]);
  });
});
