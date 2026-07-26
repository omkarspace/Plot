import { chunkShow, chunkDiscoveryItem } from "../chunking";

describe("chunkShow", () => {
  it("creates genre chunks from WatchlistItem", () => {
    const chunks = chunkShow({
      id: 1,
      type: "tv",
      title: "Breaking Bad",
      posterPath: null,
      totalRuntimeMinutes: 3000,
      addedAt: Date.now(),
      genres: ["Drama", "Thriller"],
      providers: ["Netflix"],
      rating: 8.9,
      year: "2008",
    });

    const genreChunks = chunks.filter(c => c.metadata.field === "genres");
    expect(genreChunks).toHaveLength(1);
    expect(genreChunks[0].content).toContain("Breaking Bad");
    expect(genreChunks[0].content).toContain("Drama, Thriller");
  });

  it("creates provider chunks from WatchlistItem", () => {
    const chunks = chunkShow({
      id: 1,
      type: "movie",
      title: "Inception",
      posterPath: null,
      totalRuntimeMinutes: 148,
      addedAt: Date.now(),
      genres: ["Sci-Fi"],
      providers: ["Netflix", "Amazon"],
      rating: 8.4,
      year: "2010",
    });

    const providerChunks = chunks.filter(c => c.metadata.field === "providers");
    expect(providerChunks).toHaveLength(1);
    expect(providerChunks[0].content).toContain("Netflix, Amazon");
  });

  it("returns empty for item with no genres or providers", () => {
    const chunks = chunkShow({
      id: 1,
      type: "tv",
      title: "Test",
      posterPath: null,
      totalRuntimeMinutes: 60,
      addedAt: Date.now(),
    });
    expect(chunks).toHaveLength(0);
  });
});

describe("chunkDiscoveryItem", () => {
  it("creates overview chunks split by sentences", () => {
    const chunks = chunkDiscoveryItem({
      id: 1,
      type: "tv",
      title: "Dark",
      overview: "A mystery. A family. A town. Secrets unfold across time. The disappearance of two children exposes relationships.",
      rating: 8.8,
      year: "2017",
      posterPath: null,
    });

    const overviewChunks = chunks.filter(c => c.metadata.field === "overview");
    expect(overviewChunks.length).toBeGreaterThanOrEqual(1);
    overviewChunks.forEach(c => {
      expect(c.content).toContain("Dark");
      expect(c.content).toContain("2017");
    });
  });

  it("creates a combined metadata chunk", () => {
    const chunks = chunkDiscoveryItem({
      id: 1,
      type: "movie",
      title: "Inception",
      overview: "A thief steals secrets.",
      rating: 8.4,
      year: "2010",
      posterPath: null,
    });

    const combinedChunks = chunks.filter(c => c.metadata.field === "combined");
    expect(combinedChunks).toHaveLength(1);
    expect(combinedChunks[0].content).toContain("Inception");
    expect(combinedChunks[0].content).toContain("movie");
    expect(combinedChunks[0].content).toContain("8.4");
  });

  it("handles empty overview", () => {
    const chunks = chunkDiscoveryItem({
      id: 1,
      type: "tv",
      title: "Test",
      overview: "",
      rating: 7.0,
      year: "2020",
      posterPath: null,
    });

    const overviewChunks = chunks.filter(c => c.metadata.field === "overview");
    expect(overviewChunks).toHaveLength(0);
    expect(chunks).toHaveLength(1); // just the combined chunk
  });
});
