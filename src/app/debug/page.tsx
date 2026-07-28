/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ChunkInfo {
  id: string;
  content: string;
  metadata: {
    showId: number;
    type: string;
    title: string;
    field: string;
    posterPath: string | null;
  };
}

interface ShowWithChunks {
  id: number;
  title: string;
  chunkCount: number;
  fields: string[];
  sampleContent: string;
}

interface InspectData {
  totalChunks: number;
  totalShows: number;
  modelLoaded: boolean;
  cacheSize: number;
  embeddingDimensions: number;
  shows: { id: number; title: string; type: string }[];
  showsWithChunks: ShowWithChunks[];
}

interface SearchResult {
  title: string;
  content: string;
  score: number;
  field: string;
  showId: number;
}

function getScoreColor(score: number): string {
  if (score >= 0.6) return "text-[#10b981]";
  if (score >= 0.4) return "text-[#3b82f6]";
  if (score >= 0.25) return "text-[#eab308]";
  return "text-[#737373]";
}

function getScoreBarColor(score: number): string {
  if (score >= 0.6) return "bg-[#10b981]";
  if (score >= 0.4) return "bg-[#3b82f6]";
  if (score >= 0.25) return "bg-[#eab308]";
  return "bg-[#737373]";
}

export default function DebugPage() {
  const [data, setData] = useState<InspectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testQuery, setTestQuery] = useState("");
  const [testResults, setTestResults] = useState<SearchResult[]>([]);
  const [testTiming, setTestTiming] = useState<{ embed: number; search: number; total: number } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ShowWithChunks | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chunks" | "search" | "pipeline">("overview");

  const fetchInspectData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/rag/inspect");
      const d = await res.json();
      setData(d);
    } catch {
      // Failed to load
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInspectData();
  }, [fetchInspectData]);

  const handleTestSearch = async () => {
    if (!testQuery.trim()) return;
    setIsSearching(true);
    setTestResults([]);
    setTestTiming(null);

    const start = performance.now();

    try {
      const res = await fetch("/api/rag/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery, topK: 10 }),
      });
      const d = await res.json();
      const end = performance.now();

      setTestResults(
        (d.results || []).map((r: { chunk: ChunkInfo; score: number }) => ({
          title: r.chunk.metadata.title,
          content: r.chunk.content,
          score: r.score,
          field: r.chunk.metadata.field,
          showId: r.chunk.metadata.showId,
        }))
      );
      setTestTiming({ embed: 0, search: 0, total: Math.round(end - start) });
    } catch {
      // Search failed
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">RAG Pipeline Inspector</h1>
            <p className="text-[#737373] text-sm">Visualize the retrieval-augmented generation system internals</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 border border-[#262626] text-[#a3a3a3] text-sm rounded-xl hover:border-[#404040] transition-colors"
          >
            ← Back to Plot
          </Link>
        </div>

        {/* Pipeline Diagram */}
        <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pipeline Flow</h2>
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-2">
            {[
              { label: "User Query", color: "bg-[#3b82f6]", icon: "?" },
              { label: "Tokenize", color: "bg-[#8b5cf6]", icon: "T" },
              { label: "Embed (384d)", color: "bg-[#8b5cf6]", icon: "E" },
              { label: "Vector Search", color: "bg-[#eab308]", icon: "V" },
              { label: "Cosine Sim", color: "bg-[#eab308]", icon: "C" },
              { label: "Top-K Filter", color: "bg-[#f97316]", icon: "K" },
              { label: "Context Build", color: "bg-[#10b981]", icon: "P" },
              { label: "LLM Generate", color: "bg-[#ef4444]", icon: "L" },
              { label: "Response", color: "bg-[#3b82f6]", icon: "R" },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 flex-shrink-0">
                <div className={`${step.color} text-white px-3 py-2 rounded-lg font-medium`}>
                  <span className="mr-1.5 opacity-60">{step.icon}</span>
                  {step.label}
                </div>
                {i < 8 && <span className="text-[#525252]">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#141414] border border-[#262626] rounded-xl p-1">
          {(["overview", "chunks", "search", "pipeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#262626] text-white"
                  : "text-[#737373] hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#737373] text-sm">Loading pipeline data...</p>
          </div>
        )}

        {!isLoading && !data && (
          <div className="text-center py-16">
            <p className="text-[#737373]">Failed to load pipeline data. Is the server running?</p>
          </div>
        )}

        {/* Overview Tab */}
        {data && activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Chunks", value: data.totalChunks, color: "text-white" },
                { label: "Total Shows", value: data.totalShows, color: "text-white" },
                { label: "Embedding Model", value: data.modelLoaded ? "Loaded" : "Not loaded", color: data.modelLoaded ? "text-[#10b981]" : "text-[#eab308]" },
                { label: "Vector Dimensions", value: data.embeddingDimensions, color: "text-[#3b82f6]" },
              ].map((stat) => (
                <div key={stat.label} className="border border-[#262626] rounded-xl bg-[#0a0a0a] p-4">
                  <p className="text-[#737373] text-[10px] uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Architecture */}
            <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Architecture</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-[#3b82f6] font-medium">Embedding</p>
                  <p className="text-[#737373]">Model: all-MiniLM-L6-v2</p>
                  <p className="text-[#737373]">Dimensions: 384</p>
                  <p className="text-[#737373]">Type: Sentence transformer</p>
                  <p className="text-[#737373]">Cache: {data.cacheSize} entries</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#eab308] font-medium">Vector Store</p>
                  <p className="text-[#737373]">Type: In-memory array</p>
                  <p className="text-[#737373]">Search: Cosine similarity</p>
                  <p className="text-[#737373]">Dedup: FNV-1a chunk IDs</p>
                  <p className="text-[#737373]">Persistence: Server-scoped</p>
                </div>
                <div className="space-y-2">
                  <p className="text-[#10b981] font-medium">Generation</p>
                  <p className="text-[#737373]">Primary: Ollama (streaming)</p>
                  <p className="text-[#737373]">Fallback: Template responses</p>
                  <p className="text-[#737373]">Max tokens: 256</p>
                  <p className="text-[#737373]">Temp: 0.7</p>
                </div>
              </div>
            </div>

            {/* Embedded Shows */}
            <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Embedded Shows</h3>
              {data.showsWithChunks.length === 0 ? (
                <p className="text-[#525252] text-sm">No shows embedded yet. Seed the knowledge base first.</p>
              ) : (
                <div className="space-y-2">
                  {data.showsWithChunks.map((show) => (
                    <button
                      key={show.id}
                      onClick={() => { setSelectedShow(show); setActiveTab("chunks"); }}
                      className="w-full flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-[#262626] hover:border-[#404040] transition-colors text-left"
                    >
                      <div>
                        <span className="text-white font-medium text-sm">{show.title}</span>
                        <span className="text-[#525252] text-xs ml-2">ID: {show.id}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {show.fields.map((f) => (
                            <span key={f} className="text-[10px] bg-[#262626] text-[#737373] px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                        <span className="text-[#3b82f6] text-xs font-medium">{show.chunkCount} chunks</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chunks Tab */}
        {data && activeTab === "chunks" && (
          <div className="space-y-4">
            {/* Show selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSelectedShow(null)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !selectedShow ? "bg-[#3b82f6] text-white" : "bg-[#141414] text-[#737373] border border-[#262626] hover:border-[#404040]"
                }`}
              >
                All Shows
              </button>
              {data.showsWithChunks.map((show) => (
                <button
                  key={show.id}
                  onClick={() => setSelectedShow(show)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedShow?.id === show.id ? "bg-[#3b82f6] text-white" : "bg-[#141414] text-[#737373] border border-[#262626] hover:border-[#404040]"
                  }`}
                >
                  {show.title}
                </button>
              ))}
            </div>

            {/* Chunk cards */}
            {data.showsWithChunks
              .filter((s) => !selectedShow || s.id === selectedShow.id)
              .map((show) => (
                <div key={show.id} className="border border-[#262626] rounded-xl bg-[#0a0a0a] overflow-hidden">
                  <div className="px-4 py-3 bg-[#141414] border-b border-[#262626] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{show.title}</span>
                      <span className="text-[#525252] text-xs">({show.id})</span>
                    </div>
                    <div className="flex gap-1">
                      {show.fields.map((f) => (
                        <span key={f} className="text-[10px] bg-[#262626] text-[#a3a3a3] px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[#a3a3a3] text-sm leading-relaxed">{show.sampleContent}</p>
                    {show.chunkCount > 1 && (
                      <p className="text-[#525252] text-xs mt-2">+{show.chunkCount - 1} more chunks</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Search Tab */}
        {data && activeTab === "search" && (
          <div className="space-y-6">
            {/* Search input */}
            <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Semantic Search Test</h3>
              <p className="text-[#737373] text-sm mb-4">
                Enter a natural language query to see how the vector search ranks results
              </p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleTestSearch()}
                  placeholder="e.g., dark thriller, sci-fi with time travel, comedy for date night..."
                  className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-3 text-white placeholder-[#525252] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                />
                <button
                  onClick={handleTestSearch}
                  disabled={!testQuery.trim() || isSearching}
                  className="px-6 py-3 bg-[#3b82f6] text-white font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50"
                >
                  {isSearching ? "Searching..." : "Test Search"}
                </button>
              </div>
              {testTiming && (
                <div className="flex gap-4 text-xs text-[#737373]">
                  <span>Total: <span className="text-[#3b82f6] font-medium">{testTiming.total}ms</span></span>
                  <span>Results: <span className="text-[#a3a3a3] font-medium">{testResults.length}</span></span>
                </div>
              )}
            </div>

            {/* Search results */}
            {testResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-[#737373] text-sm">
                  {testResults.length} results for &quot;{testQuery}&quot;
                </p>
                {testResults.map((result, i) => (
                  <div
                    key={i}
                    className="border border-[#262626] rounded-xl bg-[#0a0a0a] p-4 hover:border-[#404040] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm">{result.title}</span>
                          <span className="text-[10px] bg-[#262626] text-[#737373] px-1.5 py-0.5 rounded">
                            {result.field}
                          </span>
                        </div>
                        <p className="text-[#737373] text-xs line-clamp-2">{result.content}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`text-xl font-bold ${getScoreColor(result.score)}`}>
                          {(result.score * 100).toFixed(0)}%
                        </div>
                        <div className="w-20 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${getScoreBarColor(result.score)}`}
                            style={{ width: `${Math.min(result.score * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && testResults.length === 0 && testQuery && (
              <div className="text-center py-8">
                <p className="text-[#737373]">No results found</p>
              </div>
            )}
          </div>
        )}

        {/* Pipeline Tab */}
        {data && activeTab === "pipeline" && (
          <div className="space-y-6">
            <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
              <h3 className="text-lg font-semibold text-white mb-4">How the RAG Pipeline Works</h3>
              <div className="space-y-6 text-sm">
                {[
                  {
                    step: "1",
                    title: "User Query",
                    desc: "Natural language input: 'something like Breaking Bad but funnier'",
                    tech: "HTTP POST /api/rag/chat",
                    color: "bg-[#3b82f6]",
                  },
                  {
                    step: "2",
                    title: "Embedding",
                    desc: "Query converted to a 384-dimensional vector using all-MiniLM-L6-v2",
                    tech: "@huggingface/transformers → pipeline('feature-extraction')",
                    color: "bg-[#8b5cf6]",
                  },
                  {
                    step: "3",
                    title: "Vector Search",
                    desc: "Cosine similarity computed against all vectors in the store",
                    tech: "In-memory array scan + dot product / (||a|| × ||b||)",
                    color: "bg-[#eab308]",
                  },
                  {
                    step: "4",
                    title: "Top-K Filtering",
                    desc: "Top 5 results above 0.2 similarity threshold selected",
                    tech: "sort() + slice(0, 5) + filter(r => r.score > 0.2)",
                    color: "bg-[#f97316]",
                  },
                  {
                    step: "5",
                    title: "Context Building",
                    desc: "Retrieved chunks formatted into a prompt with conversation history",
                    tech: "Template: Knowledge Base + Conversation + User Query",
                    color: "bg-[#10b981]",
                  },
                  {
                    step: "6",
                    title: "LLM Generation",
                    desc: "Context sent to Ollama (streaming) or falls back to template responses",
                    tech: "Ollama API /api/chat + SSE streaming → ReadableStream",
                    color: "bg-[#ef4444]",
                  },
                  {
                    step: "7",
                    title: "Response",
                    desc: "Answer streamed to the client token-by-token with source attribution",
                    tech: "text/event-stream → chunk-by-chunk React state updates",
                    color: "bg-[#3b82f6]",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className={`${item.color} w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium mb-1">{item.title}</h4>
                      <p className="text-[#737373] text-sm mb-1">{item.desc}</p>
                      <p className="text-[#525252] text-xs font-mono bg-[#141414] px-2 py-1 rounded inline-block">
                        {item.tech}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key metrics */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
                <h3 className="text-base font-semibold text-white mb-3">Data Flow</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Shows in KB</span>
                    <span className="text-white font-medium">{data.totalShows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Total chunks</span>
                    <span className="text-white font-medium">{data.totalChunks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Avg chunks/show</span>
                    <span className="text-white font-medium">
                      {data.totalShows > 0 ? (data.totalChunks / data.totalShows).toFixed(1) : "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Embedding cache</span>
                    <span className="text-white font-medium">{data.cacheSize} entries</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Embedding dimensions</span>
                    <span className="text-white font-medium">{data.embeddingDimensions}d</span>
                  </div>
                </div>
              </div>
              <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] p-6">
                <h3 className="text-base font-semibold text-white mb-3">Chunking Strategy</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Overview chunks</span>
                    <span className="text-white font-medium">Split by sentences (3 per chunk)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Genre metadata</span>
                    <span className="text-white font-medium">One chunk per show</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Provider metadata</span>
                    <span className="text-white font-medium">One chunk per show</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">Combined metadata</span>
                    <span className="text-white font-medium">Rating + year + type</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#737373]">ID generation</span>
                    <span className="text-white font-medium">FNV-1a hash (deterministic)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
