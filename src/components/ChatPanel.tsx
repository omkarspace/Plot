"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { SearchResult } from "@/types/rag";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: SearchResult[];
  id: number;
}

const SUGGESTED_PROMPTS = [
  "What should I watch tonight?",
  "Something like Breaking Bad but funnier",
  "Best sci-fi on Netflix",
  "Hidden gems with high ratings",
];

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-[#262626] px-1.5 py-0.5 rounded text-xs text-[#e4e4e7]">$1</code>')
    .replace(/^• (.+)$/gm, '<div class="flex gap-2 ml-1"><span class="text-[#3b82f6]">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 ml-1"><span class="text-[#3b82f6] font-semibold">$1.</span><span>$2</span></div>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br/>');
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "connected" | "unavailable">("checking");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgIdRef = useRef(0);

  useEffect(() => {
    fetch("/api/rag/ollama")
      .then(r => r.json())
      .then(d => setOllamaStatus(d.available ? "connected" : "unavailable"))
      .catch(() => setOllamaStatus("unavailable"));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput || input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: text,
      id: ++msgIdRef.current,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          history: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response || "Sorry, I encountered an error.",
        sources: data.searchResults || [],
        id: ++msgIdRef.current,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get a response. Make sure the knowledge base is seeded.",
          id: ++msgIdRef.current,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 0;

  const statusIndicator = useMemo(() => {
    switch (ollamaStatus) {
      case "checking":
        return <span className="w-2 h-2 bg-[#eab308] rounded-full animate-pulse" />;
      case "connected":
        return <span className="w-2 h-2 bg-[#10b981] rounded-full" />;
      case "unavailable":
        return <span className="w-2 h-2 bg-[#737373] rounded-full" />;
    }
  }, [ollamaStatus]);

  const statusText = useMemo(() => {
    switch (ollamaStatus) {
      case "checking": return "Checking LLM...";
      case "connected": return "Ollama connected";
      case "unavailable": return "Template mode (no LLM)";
    }
  }, [ollamaStatus]);

  return (
    <div className="border border-[#262626] rounded-2xl bg-[#0a0a0a] overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-[#141414] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center">
            <span className="text-[#3b82f6] text-sm font-bold">AI</span>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-white text-sm">Ask Plot</h3>
            <div className="flex items-center gap-2">
              {statusIndicator}
              <p className="text-[#737373] text-xs">{statusText}</p>
            </div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[#737373] transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-[#262626]">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {showSuggestions && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#3b82f6]/10 flex items-center justify-center mb-4">
                  <span className="text-[#3b82f6] text-xl font-bold">P</span>
                </div>
                <p className="text-[#737373] text-sm mb-1">What are you in the mood for?</p>
                <p className="text-[#525252] text-xs mb-6">I&apos;ll search the knowledge base for the best matches</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isLoading}
                      className="px-3 py-1.5 bg-[#141414] border border-[#262626] rounded-lg text-xs text-[#a3a3a3] hover:border-[#3b82f6]/50 hover:text-[#3b82f6] transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showSuggestions && messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#3b82f6] text-white"
                      : "bg-[#141414] text-[#d4d4d4] border border-[#262626]"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="text-sm leading-relaxed [&_strong]:text-white [&_strong]:font-semibold [&_em]:italic [&_code]:bg-[#262626] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#262626]">
                      <p className="text-[10px] text-[#525252] uppercase tracking-wider mb-1">Sources</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.slice(0, 4).map((s, j) => (
                          <span
                            key={j}
                            className="text-[11px] bg-[#1a1a1a] text-[#737373] px-2 py-0.5 rounded-md border border-[#262626]"
                          >
                            {s.chunk.metadata.title}
                            <span className="text-[#525252] ml-1">{(s.score * 100).toFixed(0)}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#141414] border border-[#262626] rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-[#525252]">Searching...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-[#262626]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about shows, get recommendations..."
                className="flex-1 bg-[#141414] border border-[#262626] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 bg-[#3b82f6] text-white text-sm font-medium rounded-xl hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
