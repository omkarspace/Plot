"use client";

import { useState } from "react";
import type { SearchResult } from "@/types/rag";

export default function SemanticSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), topK: 10 }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Semantic Search</h1>
          <p className="text-[#737373]">
            Search the knowledge base using natural language
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., something dark and twisty, sci-fi with time travel..."
            className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#525252] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isLoading}
            className="px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50"
          >
            {isLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {searched && !isLoading && results.length === 0 && (
          <div className="text-center py-12 text-[#737373]">
            <p>No results found for &quot;{query}&quot;</p>
            <p className="text-sm mt-2">Try seeding the knowledge base first</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-[#737373] text-sm mb-4">
              {results.length} result{results.length !== 1 ? "s" : ""} for &quot;{query}&quot;
            </p>
            {results.map((result, i) => (
              <div
                key={i}
                className="border border-[#262626] rounded-xl p-4 bg-[#0a0a0a] hover:border-[#404040] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{result.chunk.metadata.title}</h3>
                      <span className="text-xs bg-[#1a1a1a] text-[#a3a3a3] px-2 py-0.5 rounded">
                        {result.chunk.metadata.type === "tv" ? "TV" : "Movie"}
                      </span>
                    </div>
                    <p className="text-[#a3a3a3] text-sm">{result.chunk.content}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${
                      result.score > 0.5 ? "text-[#10b981]" : result.score > 0.3 ? "text-[#eab308]" : "text-[#737373]"
                    }`}>
                      {(result.score * 100).toFixed(0)}%
                    </div>
                    <p className="text-[#525252] text-xs">relevance</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
