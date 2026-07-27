# Plot

Stop scrolling. Start watching. A smart movie/TV discovery app with a built-in RAG (Retrieval-Augmented Generation) system for semantic search and conversational recommendations.

## Features

### Core
- **Search** — Find any TV show or movie via TMDB with instant autocomplete
- **Watchlist** — Save shows and track total queued time
- **Streaming Providers** — See where content is available to watch
- **Stats** — Total runtime, show count, and watch progress
- **Episode Tracker** — Track your progress through TV series

### Smart Filter
- **Time Budget** — Filter by available watching time (30min, 1hr, 2hr, all)
- **Service Filter** — Filter by your streaming services (Netflix, Disney+, HBO, etc.)
- **Genre Filter** — Filter by mood and genre
- **TMDB Discover** — Real-time content discovery from TMDB's catalog

### RAG System (Retrieval-Augmented Generation)
- **Semantic Search** — Natural language queries like "dark thriller with plot twists" against a vector knowledge base
- **Vector Embeddings** — Powered by `@huggingface/transformers` (Xenova/all-MiniLM-L6-v2)
- **Cosine Similarity** — In-memory vector store with relevance scoring
- **Conversational AI** — Chat with the knowledge base via Ollama (or fallback to template mode)
- **Knowledge Base** — Pre-seeded with 30 popular shows/movies, extensible via user watchlist
- **Search Page** — Dual-mode search (semantic + TMDB) with visual similarity scores and color-coded match quality

## Getting Started

### 1. Get a TMDB API Key

Sign up at [themoviedb.org](https://www.themoviedb.org/settings/api) (free).

### 2. Install dependencies

```bash
npm install
```

### 3. Set your API key

Create `.env.local` in the project root:

```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. (Optional) Set up Ollama for conversational AI

```bash
# Install Ollama: https://ollama.com
ollama pull llama3.2
```

Set in `.env.local`:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Without Ollama, the chat still works using template-based responses.

### 6. Seed the knowledge base

Click "Seed Demo Data" in the Knowledge Base panel on the home page, or "Embed My Watchlist" to add your own shows.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint
npm run test     # Run tests (Jest)
```

## Tech Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) v4
- [TMDB API](https://developer.themoviedb.org) for show/movie data
- [@huggingface/transformers](https://huggingface.co/docs/transformers.js) for local vector embeddings
- [Ollama](https://ollama.com) (optional) for conversational LLM responses
- localStorage for watchlist persistence
- Jest for testing

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with nav
│   │   ├── page.tsx                # Home page
│   │   ├── search/page.tsx         # Semantic + TMDB search
│   │   └── globals.css
│   ├── components/
│   │   ├── SearchBar.tsx           # TMDB search + autocomplete
│   │   ├── ShowDetail.tsx          # Show/movie detail panel
│   │   ├── Watchlist.tsx           # Watchlist grid
│   │   ├── StatsBar.tsx            # Total time display
│   │   ├── SmartFilter.tsx         # Time/service/genre filter
│   │   ├── FilteredResults.tsx     # Filtered content grid
│   │   ├── ChatPanel.tsx           # Conversational AI chat
│   │   ├── KnowledgeBase.tsx       # RAG knowledge base panel
│   │   ├── ServiceSelector.tsx     # Streaming service picker
│   │   └── EmptyState.tsx          # Empty state illustrations
│   ├── hooks/
│   │   ├── useWatchlist.ts         # Watchlist state management
│   │   ├── useProgress.ts          # Episode tracking
│   │   └── useSmartFilter.ts       # Smart filter logic
│   ├── lib/
│   │   ├── tmdb.ts                 # TMDB API client
│   │   ├── localStorage.ts         # Watchlist/read state CRUD
│   │   ├── time.ts                 # Duration formatting
│   │   ├── services.ts             # Streaming service data
│   │   ├── filter.ts               # Filter utilities
│   │   └── rag/
│   │       ├── embeddings.ts       # Vector embedding generation
│   │       ├── chunking.ts         # Text chunking for shows
│   │       ├── vectorStore.ts      # In-memory vector store
│   │       ├── cache.ts            # Embedding cache layer
│   │       ├── generator.ts        # Ollama/template LLM generation
│   │       ├── pipeline.ts         # RAG pipeline orchestrator
│   │       ├── seedData.ts         # Demo knowledge base data
│   │       └── __tests__/          # Unit tests
│   ├── types/
│   │   ├── index.ts                # Core app types
│   │   └── rag.ts                  # RAG-specific types
│   └── app/api/rag/
│       ├── search/route.ts         # Semantic search endpoint
│       ├── chat/route.ts           # RAG chat endpoint
│       ├── seed/route.ts           # Knowledge base seeding
│       ├── status/route.ts         # KB status check
│       ├── ollama/route.ts         # Ollama connection check
│       ├── generate/route.ts       # LLM generation endpoint
│       └── embed-watchlist/route.ts # Embed user watchlist
├── jest.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Architecture

### RAG Pipeline

```
User Query
    ↓
Embedding (all-MiniLM-L6-v2)
    ↓
Vector Search (cosine similarity)
    ↓
Top-K Results → Context Prompt
    ↓
LLM Generation (Ollama / template fallback)
    ↓
Response with source attribution
```

1. **Embedding** — Text is converted to 384-dimensional vectors using a local transformer model
2. **Search** — Cosine similarity finds the most relevant chunks from the in-memory vector store
3. **Generation** — Retrieved context + user query is sent to Ollama (or uses template fallback) to generate a natural language response
4. **Response** — Includes the answer plus source attribution with relevance scores

### Vector Store

The vector store is in-memory (no database required). Each show is chunked into:
- Overview chunks (split by sentences for long descriptions)
- Genre metadata chunks
- Provider metadata chunks
- Combined metadata chunks

The knowledge base ships with 30 pre-seeded popular shows and movies. Users can also embed their own watchlist.

## Deploy

Deploy to [Vercel](https://vercel.com):

1. Push to GitHub
2. Import on Vercel
3. Add `NEXT_PUBLIC_TMDB_API_KEY` as an environment variable
4. Deploy

> **Note:** The RAG system's vector store resets on each serverless function invocation on Vercel. For persistent RAG, the seed endpoint runs on each cold start.

## License

MIT
