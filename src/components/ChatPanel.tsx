"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(text: string): string {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-flap-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-flap-shadow px-1 py-0.5 text-flap-white border border-ruled font-[family-name:var(--font-mono)] text-[11px]">$1</code>')
    .replace(/^• (.+)$/gm, '<div class="flex gap-2 ml-1"><span class="text-delay-amber">•</span><span>$1</span></div>')
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-2 ml-1"><span class="text-delay-amber font-semibold">$1.</span><span>$2</span></div>')
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
  const messagesRef = useRef<Message[]>([]);

  useEffect(() => {
    fetch("/api/rag/ollama")
      .then(r => r.json())
      .then(d => setOllamaStatus(d.available ? "connected" : "unavailable"))
      .catch(() => setOllamaStatus("unavailable"));
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isExpanded) inputRef.current?.focus();
  }, [isExpanded]);

  const handleSend = useCallback(async (overrideInput?: string) => {
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

    const assistantId = ++msgIdRef.current;

    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: userMessage.content,
          history: messagesRef.current.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";
        let sources: SearchResult[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "meta") {
                sources = event.searchResults;
              } else if (event.type === "chunk") {
                fullContent += event.content;
                setMessages((prev) => {
                  const existing = prev.find((m) => m.id === assistantId);
                  if (existing) {
                    return prev.map((m) =>
                      m.id === assistantId ? { ...m, content: fullContent } : m
                    );
                  }
                  return [...prev, { role: "assistant", content: fullContent, sources, id: assistantId }];
                });
              } else if (event.type === "done") {
                fullContent = event.fullResponse || fullContent;
              } else if (event.type === "error") {
                fullContent = event.message || "Streaming failed";
              }
            } catch {
              // Skip malformed
            }
          }
        }

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantId);
          if (existing) {
            return prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent || existing.content, sources: sources || existing.sources } : m
            );
          }
          return [...prev, { role: "assistant", content: fullContent, sources, id: assistantId }];
        });
      } else {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "Sorry, I encountered an error.",
            sources: data.searchResults || [],
            id: assistantId,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to get a response. Make sure the knowledge base is seeded.",
          id: assistantId,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

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
        return <span className="w-2 h-2 bg-delay-amber rounded-full animate-pulse" />;
      case "connected":
        return <span className="w-2 h-2 bg-delay-amber rounded-full" />;
      case "unavailable":
        return <span className="w-2 h-2 bg-steel-dark rounded-full" />;
    }
  }, [ollamaStatus]);

  const statusText = useMemo(() => {
    switch (ollamaStatus) {
      case "checking": return "Checking...";
      case "connected": return "Ollama connected";
      case "unavailable": return "Template mode";
    }
  }, [ollamaStatus]);

  return (
    <div className="border border-ruled bg-flap-black">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-flap-shadow transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-[2px]">
            {"INFO".split("").map((char) => (
              <span key={char} className="flap-char text-xs w-5 h-6">{char}</span>
            ))}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-flap-white text-xs uppercase tracking-wider font-[family-name:var(--font-board)]">
              Station Info
            </h3>
            <div className="flex items-center gap-2">
              {statusIndicator}
              <p className="text-steel-dark text-[10px] font-[family-name:var(--font-mono)]">{statusText}</p>
            </div>
          </div>
        </div>
        <span className={`text-steel-dark text-xs transition-transform ${isExpanded ? "rotate-90" : ""}`}>
          →
        </span>
      </button>

      {isExpanded && (
        <div className="border-t border-ruled">
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {showSuggestions && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex gap-[2px] mb-4">
                  {"PLOT".split("").map((char) => (
                    <span key={char} className="flap-char text-xl w-8 h-10">{char}</span>
                  ))}
                </div>
                <p className="text-steel-dark text-xs uppercase tracking-wider font-[family-name:var(--font-board)] mb-1">
                  What&apos;s your departure?
                </p>
                <p className="text-steel-dark/60 text-[10px] uppercase tracking-wider font-[family-name:var(--font-board)] mb-5">
                  Ask the station for recommendations
                </p>
                <div className="flex flex-wrap gap-0 justify-center max-w-md border border-ruled">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      disabled={isLoading}
                      className="px-3 py-2 text-[10px] uppercase tracking-wider text-steel-frame hover:text-delay-amber hover:bg-flap-shadow transition-colors border-r border-ruled last:border-r-0 font-[family-name:var(--font-board)]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!showSuggestions && messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-delay-amber/10 border border-delay-amber/30 text-flap-white"
                      : "bg-flap-shadow border border-ruled text-steel-frame"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div
                      className="text-sm leading-relaxed font-[family-name:var(--font-board)] [&_strong]:text-flap-white [&_strong]:font-semibold [&_em]:italic"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    <p className="text-sm uppercase tracking-wider font-[family-name:var(--font-board)]">{msg.content}</p>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-ruled">
                      <p className="text-[9px] text-steel-dark uppercase tracking-wider font-[family-name:var(--font-board)] mb-1">
                        Sources
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {msg.sources.slice(0, 4).map((s, j) => (
                          <span
                            key={j}
                            className="text-[10px] bg-flap-black text-steel-dark px-2 py-0.5 border border-ruled font-[family-name:var(--font-mono)]"
                          >
                            {s.chunk.metadata.title}
                            <span className="ml-1">{(s.score * 100).toFixed(0)}%</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-flap-shadow border border-ruled px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-[2px]">
                      {". . .".split(" ").map((char, i) => (
                        <span
                          key={i}
                          className="flap-char w-4 h-5 text-[10px] animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] text-steel-dark font-[family-name:var(--font-board)] uppercase tracking-wider">
                      Scanning
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-ruled">
            <div className="flex gap-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="ASK THE STATION"
                className="flex-1 bg-flap-black border border-ruled px-4 py-3 text-xs uppercase tracking-wider text-flap-white placeholder-steel-dark focus:outline-none focus:border-delay-amber transition-colors font-[family-name:var(--font-board)]"
                disabled={isLoading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="px-5 py-3 bg-delay-amber text-flap-black text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-semibold hover:bg-delay-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
