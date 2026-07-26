import type { SearchResult } from "@/types/rag";

interface GenerationContext {
  query: string;
  results: SearchResult[];
  conversationHistory?: { role: string; content: string }[];
}

export const generateResponse = async (context: GenerationContext): Promise<string> => {
  const { query, results, conversationHistory = [] } = context;

  if (results.length === 0) {
    return generateNoResultsResponse(query);
  }

  const contextText = results
    .map((r, i) => `[${i + 1}] ${r.chunk.content} (relevance: ${(r.score * 100).toFixed(0)}%)`)
    .join("\n");

  const recentHistory = conversationHistory.slice(-4);
  const historyText = recentHistory.length > 0
    ? "\n\nPrevious conversation:\n" + recentHistory.map((m) => `${m.role}: ${m.content}`).join("\n")
    : "";

  const prompt = `You are a helpful movie/TV recommendation assistant called Plot. Based on the following relevant content from your knowledge base, answer the user's question. Be concise, conversational, and helpful.

Knowledge Base Context:
${contextText}
${historyText}

User Question: ${query}

Answer:`;

  try {
    const response = await fetch("/api/rag/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, results }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
  } catch {
    // Fall through to template response
  }

  return generateTemplateResponse(query, results);
};

const generateNoResultsResponse = (query: string): string => {
  return `I don't have specific recommendations for "${query}" in my knowledge base yet. Try asking about shows or movies you'd like to explore, like "something like Breaking Bad" or "good sci-fi on Netflix". You can also seed more content into the knowledge base.`;
};

const generateTemplateResponse = (query: string, results: SearchResult[]): string => {
  const topResults = results.slice(0, 3);
  const titles = [...new Set(topResults.map((r) => r.chunk.metadata.title))];

  if (query.toLowerCase().includes("recommend") || query.toLowerCase().includes("suggest")) {
    return `Based on your interests, here are some recommendations:\n\n${topResults.map((r, i) => `${i + 1}. **${r.chunk.metadata.title}** (${r.chunk.metadata.type === "tv" ? "TV Series" : "Movie"}) - ${r.chunk.content}`).join("\n\n")}\n\nThese were matched based on your query with relevance scores from ${(topResults[0]?.score * 100).toFixed(0)}% to ${(topResults[topResults.length - 1]?.score * 100).toFixed(0)}%.`;
  }

  return `I found ${titles.length} relevant result${titles.length > 1 ? "s" : ""} for "${query}":\n\n${topResults.map((r) => `• **${r.chunk.metadata.title}**: ${r.chunk.content}`).join("\n\n")}`;
};

export const generateWithTemplate = generateTemplateResponse;
