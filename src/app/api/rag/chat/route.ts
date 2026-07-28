import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { query, history = [] } = await request.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (typeof history !== "undefined" && !Array.isArray(history)) {
      return NextResponse.json({ error: "Invalid history format" }, { status: 400 });
    }

    const { runRAGPipeline } = await import("@/lib/rag/pipeline");
    const result = await runRAGPipeline(query, history);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
