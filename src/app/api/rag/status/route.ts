import { NextResponse } from "next/server";
import { getStoreSize, getUniqueShows } from "@/lib/rag/vectorStore";
import { getCacheSize } from "@/lib/rag/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const totalChunks = getStoreSize();
  const shows = getUniqueShows();
  const uniqueShows = Array.from(shows.entries()).map(([id, info]) => ({
    id,
    ...info,
  }));

  return NextResponse.json({
    seeded: totalChunks > 0,
    totalChunks,
    totalEmbeddings: totalChunks,
    totalShows: shows.size,
    cacheSize: getCacheSize(),
    shows: uniqueShows,
  });
}
