import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { getWatchlist } = await import("@/lib/localStorage");
    const { embedText } = await import("@/lib/rag/embeddings");
    const { chunkDiscoveryItem } = await import("@/lib/rag/chunking");
    const { addVectors, hasShow } = await import("@/lib/rag/vectorStore");
    const { getCachedEmbedding, setCachedEmbedding } = await import("@/lib/rag/cache");

    const watchlist = getWatchlist();
    if (watchlist.length === 0) {
      return NextResponse.json({ seeded: 0, skipped: 0, message: "Watchlist is empty" });
    }

    let seeded = 0;
    let skipped = 0;

    for (const item of watchlist) {
      if (hasShow(item.id)) {
        skipped++;
        continue;
      }

      try {
        const overview = item.genres && item.genres.length > 0
          ? `${item.title} is a ${item.type === "tv" ? "TV show" : "movie"} (${item.year || "unknown year"}) rated ${item.rating || "unknown"}/10. Genres: ${item.genres.join(", ")}. Available on: ${(item.providers || []).join(", ") || "unknown"}.`
          : `${item.title} is a ${item.type === "tv" ? "TV show" : "movie"} rated ${item.rating || "unknown"}/10.`;

        const discoveryLike = {
          id: item.id,
          type: item.type,
          title: item.title,
          overview,
          rating: item.rating || 0,
          year: item.year || "unknown",
          posterPath: item.posterPath,
        };

        const chunks = chunkDiscoveryItem(discoveryLike);
        const entries = [];

        for (const chunk of chunks) {
          let embedding = getCachedEmbedding(chunk.content);
          if (!embedding) {
            embedding = await embedText(chunk.content);
            setCachedEmbedding(chunk.content, embedding);
          }
          entries.push({ chunk, embedding });
        }

        addVectors(entries);
        seeded++;
      } catch (e) {
        console.error(`Failed to embed watchlist item "${item.title}":`, e);
      }
    }

    return NextResponse.json({ seeded, skipped });
  } catch {
    return NextResponse.json({ error: "Failed to embed watchlist" }, { status: 500 });
  }
}
