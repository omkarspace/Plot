import { cosineSimilarity, addVectors, searchVectors, getStoreSize, clearStore, hasShow, removeShow, getChunksByShow } from "../vectorStore";
import type { VectorEntry } from "@/types/rag";

beforeEach(() => {
  clearStore();
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    const vec = [1, 0, 0];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 10);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0, 10);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0, 10);
  });

  it("returns 0 for mismatched lengths", () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });

  it("returns 0 for zero vectors", () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
  });

  it("handles normalized vectors correctly", () => {
    const a = [0.6, 0.8];
    const b = [0.8, 0.6];
    expect(cosineSimilarity(a, b)).toBeCloseTo(0.96, 2);
  });
});

describe("vector store", () => {
  const makeEntry = (showId: number, content: string): VectorEntry => ({
    chunk: {
      id: `${showId}-test`,
      content,
      metadata: {
        showId,
        type: "tv",
        title: `Show ${showId}`,
        field: "overview",
        posterPath: null,
      },
    },
    embedding: [1, 0, 0],
  });

  it("starts empty", () => {
    expect(getStoreSize()).toBe(0);
  });

  it("adds vectors and tracks size", () => {
    addVectors([makeEntry(1, "test")]);
    expect(getStoreSize()).toBe(1);
    addVectors([makeEntry(2, "test2"), makeEntry(3, "test3")]);
    expect(getStoreSize()).toBe(3);
  });

  it("searches by cosine similarity and returns top K", () => {
    addVectors([
      { ...makeEntry(1, "test"), embedding: [1, 0, 0] },
      { ...makeEntry(2, "test2"), embedding: [0, 1, 0] },
      { ...makeEntry(3, "test3"), embedding: [0.7, 0.7, 0] },
    ]);

    const results = searchVectors([1, 0, 0], 2);
    expect(results).toHaveLength(2);
    expect(results[0].chunk.metadata.showId).toBe(1);
    expect(results[0].score).toBeCloseTo(1.0, 5);
  });

  it("hasShow detects presence", () => {
    expect(hasShow(1)).toBe(false);
    addVectors([makeEntry(1, "test")]);
    expect(hasShow(1)).toBe(true);
    expect(hasShow(999)).toBe(false);
  });

  it("removeShow removes all chunks for a show", () => {
    addVectors([makeEntry(1, "a"), makeEntry(1, "b"), makeEntry(2, "c")]);
    expect(getStoreSize()).toBe(3);
    removeShow(1);
    expect(getStoreSize()).toBe(1);
    expect(hasShow(1)).toBe(false);
    expect(hasShow(2)).toBe(true);
  });

  it("getChunksByShow returns chunks for a specific show", () => {
    addVectors([makeEntry(1, "a"), makeEntry(2, "b")]);
    const chunks = getChunksByShow(1);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].metadata.showId).toBe(1);
  });

  it("clearStore empties everything", () => {
    addVectors([makeEntry(1, "test")]);
    clearStore();
    expect(getStoreSize()).toBe(0);
  });
});
