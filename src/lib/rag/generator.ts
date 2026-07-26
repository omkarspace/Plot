import type { SearchResult } from "@/types/rag";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

interface GenerationContext {
  query: string;
  results: SearchResult[];
  conversationHistory?: { role: string; content: string }[];
}

export const isOllamaAvailable = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const getAvailableModels = async (): Promise<string[]> => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: { name: string }) => m.name);
  } catch {
    return [];
  }
};

const buildSystemPrompt = (): string => {
  return `You are Plot, a friendly and knowledgeable movie/TV recommendation assistant. You have access to a knowledge base of shows and movies. Answer questions conversationally, be concise (2-4 sentences max unless asked for detail), and always reference specific titles from the context. If you don't find relevant matches, say so honestly and suggest the user try different terms or seed more content.`;
};

const buildUserPrompt = (context: GenerationContext): string => {
  const { query, results, conversationHistory = [] } = context;

  const contextText = results
    .map((r, i) => `[${i + 1}] ${r.chunk.content} (relevance: ${(r.score * 100).toFixed(0)}%)`)
    .join("\n");

  const recentHistory = conversationHistory.slice(-4);
  const historyText = recentHistory.length > 0
    ? recentHistory.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n")
    : "";

  let prompt = `Knowledge Base:\n${contextText}\n`;
  if (historyText) prompt += `\nConversation:\n${historyText}\n`;
  prompt += `\nUser: ${query}\nAssistant:`;

  return prompt;
};

export const generateWithOllama = async (context: GenerationContext): Promise<string | null> => {
  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(context);

    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 256,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.message?.content?.trim() || null;
  } catch {
    return null;
  }
};

export const generateResponse = async (context: GenerationContext): Promise<string> => {
  if (context.results.length === 0) {
    return generateNoResultsResponse(context.query);
  }

  // Try Ollama first
  const ollamaResponse = await generateWithOllama(context);
  if (ollamaResponse) return ollamaResponse;

  // Fallback to template
  return generateTemplateResponse(context.query, context.results);
};

export const generateNoResultsResponse = (query: string): string => {
  return `I don't have specific recommendations for "${query}" in my knowledge base yet. Try asking about shows or movies you'd like to explore, like "something like Breaking Bad" or "good sci-fi on Netflix". You can also seed more content into the knowledge base.`;
};

export const generateTemplateResponse = (query: string, results: SearchResult[]): string => {
  const topResults = results.slice(0, 3);
  const titles = [...new Set(topResults.map((r) => r.chunk.metadata.title))];

  if (query.toLowerCase().includes("recommend") || query.toLowerCase().includes("suggest")) {
    return `Based on your interests, here are some recommendations:\n\n${topResults.map((r, i) => `${i + 1}. **${r.chunk.metadata.title}** (${r.chunk.metadata.type === "tv" ? "TV Series" : "Movie"}) - ${r.chunk.content}`).join("\n\n")}\n\nThese were matched based on your query with relevance scores from ${(topResults[0]?.score * 100).toFixed(0)}% to ${(topResults[topResults.length - 1]?.score * 100).toFixed(0)}%.`;
  }

  return `I found ${titles.length} relevant result${titles.length > 1 ? "s" : ""} for "${query}":\n\n${topResults.map((r) => `• **${r.chunk.metadata.title}**: ${r.chunk.content}`).join("\n\n")}`;
};
