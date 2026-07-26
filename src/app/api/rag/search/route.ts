import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, topK = 5 } = await request.json();
    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }
    const { runSemanticSearch } = await import("@/lib/rag/pipeline");
    const results = await runSemanticSearch(query, topK);
    return NextResponse.json({ results, query });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
