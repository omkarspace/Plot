import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { getAllChunks, getStoreSize, getUniqueShows, cosineSimilarity } = await import("@/lib/rag/vectorStore");
  const { isModelLoaded } = await import("@/lib/rag/embeddings");
  const { getCacheSize } = await import("@/lib/rag/cache");

  const chunks = getAllChunks();
  const shows = getUniqueShows();
  const showList = Array.from(shows.entries()).map(([id, info]) => ({ id, ...info }));

  // Sample embedding dimensions from first chunk
  const dimensions = chunks.length > 0 ? 384 : 0; // all-MiniLM-L6-v2 = 384 dims

  // Group chunks by show
  const chunksByShow = new Map<number, { title: string; chunks: typeof chunks }>();
  for (const chunk of chunks) {
    const existing = chunksByShow.get(chunk.metadata.showId);
    if (existing) {
      existing.chunks.push(chunk);
    } else {
      chunksByShow.set(chunk.metadata.showId, {
        title: chunk.metadata.title,
        chunks: [chunk],
      });
    }
  }

  const showsWithChunks = Array.from(chunksByShow.entries()).map(([id, data]) => ({
    id,
    title: data.title,
    chunkCount: data.chunks.length,
    fields: [...new Set(data.chunks.map((c) => c.metadata.field))],
    sampleContent: data.chunks[0]?.content?.slice(0, 150) || "",
  }));

  return NextResponse.json({
    totalChunks: getStoreSize(),
    totalShows: shows.size,
    modelLoaded: isModelLoaded(),
    cacheSize: getCacheSize(),
    embeddingDimensions: dimensions,
    shows: showList,
    showsWithChunks,
    cosineSimilarity: typeof cosineSimilarity === "function" ? "available" : "not available",
  });
}
