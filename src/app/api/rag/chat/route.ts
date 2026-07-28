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

    const { ensureSeeded } = await import("@/lib/rag/pipeline");
    const { embedText } = await import("@/lib/rag/embeddings");
    const { searchVectors, getStoreSize } = await import("@/lib/rag/vectorStore");
    const { generateWithOllamaStreaming, generateResponse, generateTemplateResponse } = await import("@/lib/rag/generator");
    const { isOllamaAvailable } = await import("@/lib/rag/generator");

    await ensureSeeded();
    const storeSize = getStoreSize();

    const queryEmbedding = await embedText(query);
    const searchResults = searchVectors(queryEmbedding, 5).filter((r: { score: number }) => r.score > 0.2);

    const context = {
      query,
      results: searchResults,
      conversationHistory: (history || []).map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    };

    const ollamaUp = await isOllamaAvailable();

    if (ollamaUp && searchResults.length > 0) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send search results metadata first
            const meta = JSON.stringify({ type: "meta", searchResults, storeSize });
            controller.enqueue(encoder.encode(`data: ${meta}\n\n`));

            let fullResponse = "";
            for await (const chunk of generateWithOllamaStreaming(context)) {
              fullResponse += chunk;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`));
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", fullResponse })}\n\n`));
            controller.close();
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Streaming failed" })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Fallback: non-streaming response
    let response: string;
    if (storeSize === 0) {
      response = "The knowledge base is empty. Please seed it first.";
    } else if (searchResults.length === 0) {
      response = `I couldn't find anything matching "${query}". Try rephrasing or seeding more content.`;
    } else {
      response = await generateResponse(context);
      if (!response) response = generateTemplateResponse(query, searchResults);
    }

    return NextResponse.json({ searchResults, storeSize, response });
  } catch {
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
