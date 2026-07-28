import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_TOP_K = 50;

export async function POST(request: Request) {
  try {
    const { query, topK = 5 } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const safeTopK = Math.min(Math.max(1, Math.floor(Number(topK) || 5)), MAX_TOP_K);

    const { runSemanticSearch } = await import("@/lib/rag/pipeline");
    const results = await runSemanticSearch(query, safeTopK);
    return NextResponse.json({ results, query });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
