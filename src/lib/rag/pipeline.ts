import { embedText } from "./embeddings";
import { searchVectors, getStoreSize } from "./vectorStore";
import { generateResponse, generateWithTemplate } from "./generator";
import type { SearchResult, ChatMessage } from "@/types/rag";

export interface PipelineResult {
  query: string;
  queryEmbedding: number[];
  searchResults: SearchResult[];
  response: string;
  storeSize: number;
}

export const runSemanticSearch = async (
  query: string,
  topK: number = 5
): Promise<SearchResult[]> => {
  if (getStoreSize() === 0) return [];

  const queryEmbedding = await embedText(query);
  return searchVectors(queryEmbedding, topK).filter((r) => r.score > 0.2);
};

export const runRAGPipeline = async (
  query: string,
  conversationHistory: ChatMessage[] = []
): Promise<PipelineResult> => {
  const storeSize = getStoreSize();

  const queryEmbedding = await embedText(query);
  const searchResults = searchVectors(queryEmbedding, 5).filter((r) => r.score > 0.2);

  let response: string;
  if (storeSize === 0) {
    response = "The knowledge base is empty. Please seed it first using the Seed button.";
  } else if (searchResults.length === 0) {
    response = `I couldn't find anything matching "${query}" in the knowledge base. Try rephrasing your question or seeding more content.`;
  } else {
    try {
      response = await generateResponse({
        query,
        results: searchResults,
        conversationHistory: conversationHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch {
      response = generateWithTemplate(query, searchResults);
    }
  }

  return {
    query,
    queryEmbedding,
    searchResults,
    response,
    storeSize,
  };
};
