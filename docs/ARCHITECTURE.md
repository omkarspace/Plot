# Plot Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Home Page│  │ Search   │  │ Debug    │  │ Layout + Nav     │   │
│  │ /        │  │ Page     │  │ Page     │  │                  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────────────┘   │
│       │              │              │                                │
│  ┌────┴──────────────┴──────────────┴─────┐                        │
│  │           15 Components                │                        │
│  │  SearchBar, SmartFilter, ShowDetail,   │                        │
│  │  Watchlist, ChatPanel, KnowledgeBase,  │                        │
│  │  FilteredResults, StatsBar, etc.       │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                 │
│  ┌────────────────┴───────────────────────┐                        │
│  │          3 Custom Hooks                │                        │
│  │  useWatchlist · useProgress ·          │                        │
│  │  useSmartFilter                        │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                 │
│  ┌────────────────┴───────────────────────┐                        │
│  │         localStorage (6 keys)         │                        │
│  │  plot-watchlist · plot-watched ·       │                        │
│  │  plot-progress · plot-services ·       │                        │
│  │  plot-search-history ·                 │                        │
│  │  plot-semantic-history                 │                        │
│  └────────────────┬───────────────────────┘                        │
│                   │                                                 │
│  ┌────────────────┴───────────────────────┐                        │
│  │         lib/tmdb.ts (client)           │                        │
│  │  searchShows · buildShowDetail ·       │                        │
│  │  discoverContent · getImageUrl         │                        │
│  └────────────────────────────────────────┘                        │
└────────────────────┬────────────────────────────────────────────────┘
                     │ HTTP fetch (client-side)
                     │
┌────────────────────┴────────────────────────────────────────────────┐
│                    TMDB API (External)                               │
│  api.themoviedb.org/3                                               │
│  search/multi · tv/{id} · movie/{id} · watch/providers ·           │
│  season/{n} · discover/tv · discover/movie                          │
│  Image CDN: image.tmdb.org/t/p/{size}{path}                         │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Next.js)                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              8 API Routes (Serverless)                     │    │
│  │                                                             │    │
│  │  POST /api/rag/chat        ← Chat with KB (SSE streaming) │    │
│  │  POST /api/rag/search      ← Semantic search only          │    │
│  │  POST /api/rag/seed        ← Seed demo data (mutex)        │    │
│  │  POST /api/rag/embed-watchlist ← Embed user watchlist      │    │
│  │  GET  /api/rag/status      ← KB health check               │    │
│  │  GET  /api/rag/inspect     ← Full KB introspection         │    │
│  │  GET  /api/rag/ollama      ← Ollama health + models        │    │
│  │  POST /api/rag/generate    ← Template fallback generation  │    │
│  └────────────────────┬───────────────────────────────────────┘    │
│                       │                                             │
│  ┌────────────────────┴───────────────────────────────────────┐    │
│  │              RAG Pipeline (src/lib/rag/)                   │    │
│  │                                                             │    │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────┐             │    │
│  │  │ pipeline│→ │embeddings│→ │ vectorStore  │             │    │
│  │  │   .ts   │  │   .ts    │  │     .ts      │             │    │
│  │  └────┬────┘  └──────────┘  └──────────────┘             │    │
│  │       │                                                     │    │
│  │  ┌────┴────┐  ┌──────────┐  ┌──────────────┐             │    │
│  │  │generator│  │chunking  │  │    cache     │             │    │
│  │  │   .ts   │  │   .ts    │  │     .ts      │             │    │
│  │  └─────────┘  └──────────┘  └──────────────┘             │    │
│  │                                                             │    │
│  │  ┌──────────┐                                              │    │
│  │  │ seedData │  ← 29 hardcoded shows/movies                │    │
│  │  │   .ts    │                                              │    │
│  │  └──────────┘                                              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                       │                                             │
└───────────┬───────────┼─────────────────────────────────────────────┘
            │           │
            │           │
   ┌────────┴───┐  ┌────┴──────────────────────────────────────┐
   │ HuggingFace │  │ Ollama (Optional, External)               │
   │ Transformers│  │ localhost:11434                            │
   │             │  │                                            │
   │ Model:      │  │ Model: llama3.2                            │
   │ Xenova/     │  │ POST /api/chat (streaming SSE)            │
   │ all-MiniLM  │  │ GET  /api/tags  (health check)            │
   │ -L6-v2      │  │                                            │
   │             │  │ Falls back to template responses           │
   │ Output:     │  │ when Ollama is unavailable                 │
   │ 384-d vector│  │                                            │
   └─────────────┘  └────────────────────────────────────────────┘
```

## Working Diagram: How Everything Connects

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION FLOW                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  1. DISCOVER │
│              │
│ User visits  │──────────────────────────────────────────┐
│ Home page    │                                          │
└──────────────┘                                          │
      │                                                   │
      ▼                                                   │
┌──────────────┐     ┌─────────────────────┐             │
│ SearchBar    │────▶│ TMDB /search/multi  │──────┐      │
│ (debounced)  │     └─────────────────────┘      │      │
└──────────────┘                                   │      │
      │                                            ▼      │
      │                                   ┌───────────┐  │
      │                                   │ Dropdown  │  │
      │                                   │ Results   │  │
      │                                   └─────┬─────┘  │
      │                                         │        │
      ▼                                         ▼        │
┌──────────────┐     ┌─────────────────────────────┐    │
│ User selects │────▶│ buildShowDetail()           │    │
│ a show       │     │                             │    │
└──────────────┘     │ ┌─ GET /tv/{id}  ─────────┐ │    │
                     │ │  GET /watch/providers    │─┼──┐ │
                     │ │  GET /tv/{id}/season/{n} │ │  │ │
                     │ └──────────────────────────┘ │  │ │
                     └──────────────────────────────┘  │ │
                                                       │ │
                     ┌─────────────────────────────┐   │ │
                     │ 3 external TMDB calls       │◀──┘ │
                     │ (parallelized)              │     │
                     └─────────────┬───────────────┘     │
                                   │                     │
                                   ▼                     │
                     ┌──────────────────────────────┐    │
                     │  ShowDetail component         │    │
                     │  - Backdrop + poster          │    │
                     │  - Rating, runtime, binge calc│    │
                     │  - Season breakdown           │    │
                     │  - Streaming providers         │    │
                     │  - Progress tracker            │    │
                     │  - Add/Remove watchlist        │    │
                     └──────────────────────────────┘    │
                                                         │
┌──────────────┐                                          │
│  2. FILTER   │                                          │
│              │                                          │
│ SmartFilter  │                                          │
│ ┌──────────┐ │     ┌──────────────────────┐            │
│ │TimeBudget│─┼────▶│ Time budget: 30m/1h/ │            │
│ └──────────┘ │     │ 2h/all               │            │
│ ┌──────────┐ │     └──────────────────────┘            │
│ │ Services │─┼────▶ localStorage (persisted)            │
│ └──────────┘ │                                          │
│ ┌──────────┐ │                                          │
│ │  Moods   │─┼────▶ TMDB Discover API                   │
│ └──────────┘ │     GET /3/discover/tv                   │
└──────┬───────┘     GET /3/discover/movie                │
       │                   │                              │
       ▼                   ▼                              │
  ┌──────────────────────────────┐                       │
  │   FilteredResults             │                       │
  │   - Watchlist matches (local)│                       │
  │   - TMDB discovery (API)     │◀──────────────────────┘
  │   - Deduplicated by ID       │
  └──────────────────────────────┘

┌──────────────┐
│  3. RAG      │
│  (Semantic   │
│   Search)    │
│              │
│ /search page │──── mode: Semantic
│   or         │     ┌────────────────────────────────┐
│ ChatPanel    │────▶│ POST /api/rag/search            │
│              │     │        or                       │
│              │     │ POST /api/rag/chat (with LLM)   │
└──────────────┘     └──────────────┬─────────────────┘
                                    │
                         ┌──────────┴──────────┐
                         │  RAG Pipeline       │
                         │                      │
                         │  1. ensureSeeded()   │
                         │     (auto-seed if    │
                         │      store is empty) │
                         │           │          │
                         │           ▼          │
                         │  2. embedText(query) │
                         │     all-MiniLM-L6-v2 │
                         │     → 384-d vector   │
                         │           │          │
                         │           ▼          │
                         │  3. searchVectors()  │
                         │     cosine similarity│
                         │     brute-force scan │
                         │           │          │
                         │           ▼          │
                         │  4. filter > 0.2     │
                         │     top 5 results    │
                         │           │          │
                         │           ▼          │
                         │  5. Generate answer  │
                         │     ┌──────────────┐ │
                         │     │ Ollama?      │ │
                         │     │ YES → stream  │ │
                         │     │ NO → template │ │
                         │     └──────────────┘ │
                         └──────────────────────┘

┌──────────────┐
│  4. CHAT     │
│              │
│ ChatPanel    │──── expand panel
│              │
│ ┌──────────┐ │     ┌──────────────────────────┐
│ │Suggested │────▶│ "What should I watch?"     │
│ │ prompts  │     │ "Something like Breaking   │
│ └──────────┘ │     │  Bad but funnier"          │
│              │     └──────────────────────────┘
│ ┌──────────┐ │
│ │ User     │────▶ POST /api/rag/chat
│ │ types    │         │
│ └──────────┘         ▼
│                 ┌──────────────────┐
│                 │ SSE Stream?      │
│                 │                  │
│                 │ YES: token-by-   │
│                 │  token via       │
│                 │  ReadableStream  │
│                 │                  │
│                 │ NO: JSON with    │
│                 │  template resp   │
│                 └────────┬─────────┘
│                          │
│                          ▼
│                 ┌──────────────────┐
│                 │ Assistant msg    │
│                 │ updates in-place │
│                 │ + source chips   │
│                 └──────────────────┘

┌──────────────┐
│  5. KNOWLEDGE│
│  BASE        │
│              │
│ KB Panel     │
│ ┌──────────┐ │
│ │ Seed     │────▶ POST /api/rag/seed
│ │ Demo     │     (mutex protected)
│ └──────────┘     → 29 shows × (overview + genre
│ ┌──────────┐       + provider + combined chunks)
│ │ Embed    │     → each chunk → embedText()
│ │ Watchlist│     → addVectors() with dedup
│ └──────────┘
│ ┌──────────┐ │
│ │ Status   │────▶ GET /api/rag/status
│ └──────────┘
└──────────────┘

┌──────────────┐
│  6. DEBUG    │
│              │
│ /debug page  │──── GET /api/rag/inspect
│              │
│ 4 tabs:      │
│ - Overview   │  Stats, architecture, shows list
│ - Chunks     │  Per-show chunk viewer
│ - Search     │  Live semantic search test
│ - Pipeline   │  Step-by-step flow diagram
└──────────────┘
```

## Data Model

```
┌──────────────────────────────────────────────────────────────┐
│                     TMDB Types                                │
│                                                               │
│  TMDBSearchResult ──────────────────────────────────────┐    │
│  TMDBTVDetail ──────────┐                               │    │
│  TMDBMovieDetail ───┐   │                               │    │
│  TMDBSeason ──────┐ │   │                               │    │
│  TMDBEpisode ──┐  │ │   │                               │    │
│                 │  │ │   │                               │    │
│                 ▼  ▼ ▼   ▼                               │    │
│         ┌──────────────────┐                             │    │
│         │   ShowDetail     │  ← Primary display model    │    │
│         │   (normalized)   │                             │    │
│         └────────┬─────────┘                             │    │
│                  │                                        │    │
│    ┌─────────────┼─────────────┐                         │    │
│    ▼             ▼             ▼                         │    │
│ ┌──────────┐ ┌──────────┐ ┌──────────────┐              │    │
│ │Watchlist │ │ Watched  │ │ShowProgress  │              │    │
│ │Item      │ │Item      │ │              │              │    │
│ │(persist) │ │(persist) │ │(persist)     │              │    │
│ └──────────┘ └──────────┘ └──────────────┘              │    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                     RAG Types                                 │
│                                                               │
│  TextChunk ────────┐                                         │
│  (content +        │                                         │
│   metadata)        ▼                                         │
│              ┌──────────────┐                                │
│              │ VectorEntry  │  ← Stored in vectorStore       │
│              │ (chunk +     │                                │
│              │  embedding)  │                                │
│              └──────┬───────┘                                │
│                     │                                        │
│                     ▼                                        │
│              ┌──────────────┐                                │
│              │ SearchResult │  ← Returned from search        │
│              │ (chunk +     │                                │
│              │  score)      │                                │
│              └──────────────┘                                │
│                                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                     localStorage Schema                       │
│                                                               │
│  plot-watchlist:     WatchlistItem[]                          │
│  plot-watched:       WatchedItem[]                            │
│  plot-progress:      ShowProgress[]                           │
│  plot-services:      { services: string[], updatedAt }        │
│  plot-search-history: SearchHistoryItem[] (max 10)            │
│  plot-semantic-history: { query, timestamp }[] (max 8)        │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout + nav bar
│   ├── page.tsx                  # Home (dashboard)
│   ├── globals.css               # Tailwind + custom styles
│   ├── search/page.tsx           # Semantic + TMDB search
│   ├── debug/page.tsx            # RAG pipeline inspector
│   └── api/rag/                  # API routes
│       ├── chat/route.ts         # POST - Full RAG chat (SSE)
│       ├── search/route.ts       # POST - Semantic search only
│       ├── seed/route.ts         # POST/GET - Seed KB
│       ├── embed-watchlist/      # POST - Embed user watchlist
│       │   route.ts
│       ├── generate/route.ts     # POST - Template generation
│       ├── inspect/route.ts      # GET - KB introspection
│       ├── ollama/route.ts       # GET - Ollama health check
│       └── status/route.ts       # GET - KB status
│
├── components/                   # 15 React components
│   ├── SearchBar.tsx             # TMDB search + autocomplete
│   ├── ShowDetail.tsx            # Full show detail view
│   ├── Watchlist.tsx             # Watchlist grid
│   ├── SmartFilter.tsx           # Composite filter panel
│   ├── TimeBudgetSlider.tsx      # Time budget buttons
│   ├── ServiceSelector.tsx       # Streaming service toggles
│   ├── MoodFilter.tsx            # Genre/mood toggles
│   ├── FilteredResults.tsx       # Filtered content display
│   ├── StatsBar.tsx              # Watchlist stats header
│   ├── EmptyState.tsx            # Empty state illustrations
│   ├── ShareButton.tsx           # Copy watchlist to clipboard
│   ├── WatchedSection.tsx        # Watched items grid
│   ├── ProgressTracker.tsx       # TV show progress tracker
│   ├── ChatPanel.tsx             # AI chat (SSE streaming)
│   └── KnowledgeBase.tsx         # KB management panel
│
├── hooks/                        # 3 custom hooks
│   ├── useWatchlist.ts           # Watchlist CRUD + total time
│   ├── useProgress.ts            # Episode tracking + binge calc
│   └── useSmartFilter.ts         # Filter state + TMDB discover
│
├── lib/                          # 6 utility modules
│   ├── tmdb.ts                   # TMDB API client (6 endpoints)
│   ├── localStorage.ts           # Client persistence (6 keys)
│   ├── filter.ts                 # Smart filter scoring logic
│   ├── services.ts               # Streaming service registry
│   └── time.ts                   # Duration formatting
│
├── lib/rag/                      # 7 RAG modules
│   ├── embeddings.ts             # Vector embedding (384d)
│   ├── chunking.ts               # Text chunking (4 strategies)
│   ├── vectorStore.ts            # In-memory vector store
│   ├── cache.ts                  # LRU embedding cache (10K)
│   ├── generator.ts              # Ollama + template generation
│   ├── pipeline.ts               # RAG pipeline orchestrator
│   ├── seedData.ts               # 29 seed shows/movies
│   └── __tests__/                # 3 test files (25 tests)
│       ├── vectorStore.test.ts
│       ├── chunking.test.ts
│       └── cache.test.ts
│
├── types/                        # Type definitions
│   ├── index.ts                  # Core domain types
│   └── rag.ts                    # RAG-specific types
│
└── data/                         # Static data
    └── services.json             # 10 streaming services
```
