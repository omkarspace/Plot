# System Design Review — Plot

**Date:** 2026-07-28  
**Reviewer:** AI Code Analysis  
**Status:** Production-readiness audit

---

## Executive Summary

Plot is a well-conceived streaming content discovery app with a solid RAG pipeline. The core architecture (Next.js 16 App Router + React 19 + TMDB + local vector store) is sound. However, there are **critical security issues**, **performance bottlenecks**, and **operational gaps** that must be addressed before production deployment.

**Verdict:** Good MVP, needs hardening for production.

---

## 1. CRITICAL Issues (Fix Immediately)

### 1.1 API Key Exposure — Security Vulnerability
**File:** `src/lib/tmdb.ts:13`

```ts
const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
```

**Problem:** `NEXT_PUBLIC_TMDB_API_KEY` is prefixed with `NEXT_PUBLIC_`, meaning it's bundled into client-side JavaScript. Anyone can inspect the browser source and extract the TMDB API key.

**Impact:** API key theft, rate limit abuse, potential TMDB account suspension.

**Fix:** 
- Remove `NEXT_PUBLIC_TMDB_API_KEY` from `.env.local`
- Use only `TMDB_API_KEY` (server-side only)
- All TMDB calls should go through API routes (already partially done for search, but `buildShowDetail` is called client-side)

### 1.2 No Rate Limiting on API Routes
**Files:** All files in `src/app/api/rag/`

**Problem:** No rate limiting on any API endpoint. An attacker could:
- Flood `/api/rag/chat` with requests
- Exhaust Ollama connections
- Cause DoS via embedding computation

**Fix:** Add rate limiting middleware (e.g., `next-rate-limit` or Upstash Redis)

### 1.3 Missing Input Sanitization
**File:** `src/app/api/rag/chat/route.ts:7`

```ts
const { query, history = [] } = await request.json();
```

**Problem:** While `query` is checked for type, there's no length limit. A 10MB string would be processed through the embedding model.

**Fix:** Add `MAX_QUERY_LENGTH` check (already exists in `generator.ts` but not enforced at the route level).

---

## 2. HIGH Priority Issues

### 2.1 Global Mutable State in Serverless
**File:** `src/lib/rag/vectorStore.ts:3`

```ts
let store: VectorEntry[] = [];
```

**Problem:** In Vercel serverless functions, each invocation may get a fresh module scope. The vector store resets on every cold start. The README acknowledges this but there's no mitigation.

**Impact:** 
- RAG system is non-functional on Vercel (seed data lost between requests)
- Users must re-seed on every page load

**Fix Options:**
1. **Vercel KV/Redis** — Persist vector store externally
2. **PostgreSQL + pgvector** — More scalable, supports similarity search natively
3. **Upstash Redis** — Serverless-friendly, supports JSON storage
4. **File-based persistence** — Write to `/tmp` (ephemeral but persists within same function instance)

### 2.2 N+1 Query Problem in TMDB
**File:** `src/lib/tmdb.ts:66-91`

```ts
const seasonResults = await Promise.allSettled(
  nonSpecialSeasons.map((season) => getSeasonDetail(tvDetail.id, season.season_number))
);
```

**Problem:** For a show with 10 seasons, this makes 10 separate API calls to TMDB. Each call has network latency + rate limit considerations.

**Impact:** Slow detail loading for long-running series (e.g., The Simpsons = 30+ seasons).

**Fix:**
- Cache season details in localStorage
- Batch requests where possible
- Show estimated runtime from `episode_run_time` without fetching all seasons

### 2.3 No Caching Layer
**Files:** `src/lib/tmdb.ts`, `src/lib/rag/embeddings.ts`

**Problem:** 
- TMDB API responses are never cached (same show fetched multiple times)
- Embeddings are computed fresh each time (despite cache.ts existing, it's not used consistently)

**Fix:** Add a caching layer:
```ts
// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();
```

### 2.4 Duplicate Code
**File:** `src/lib/tmdb.ts:110-117` and `src/lib/tmdb.ts:165-172`

```ts
// TV providers
let providers: StreamingProvider[] = [];
const usProviders = watchData?.results?.["US"];
if (usProviders?.flatrate) {
  providers = usProviders.flatrate.map((p) => ({...}));
}

// Movie providers (identical)
let providers: StreamingProvider[] = [];
const usProviders = watchData?.results?.["US"];
if (usProviders?.flatrate) {
  providers = usProviders.flatrate.map((p) => ({...}));
}
```

**Fix:** Extract to a shared function:
```ts
const extractProviders = (watchData: TMDBWatchProviders | null): StreamingProvider[] => {
  const usProviders = watchData?.results?.["US"];
  return usProviders?.flatrate?.map((p) => ({
    name: p.provider_name,
    logoPath: p.logo_path,
  })) || [];
};
```

---

## 3. MEDIUM Priority Issues

### 3.1 Type Safety Issues
**File:** `src/lib/rag/embeddings.ts:14,38,47`

```ts
export const getExtractor = async (): Promise<unknown> => {...}
const ext = (await getExtractor()) as any;
```

**Problem:** Using `any` and `unknown` defeats TypeScript's purpose. The HuggingFace pipeline type should be properly typed.

**Fix:** Import the correct type from `@huggingface/transformers`:
```ts
import { pipeline, FeatureExtractionPipeline } from "@huggingface/transformers";
```

### 3.2 No Error Boundaries
**File:** `src/app/layout.tsx`

**Problem:** No React error boundaries. If any component throws during render, the entire app crashes with a white screen.

**Fix:** Add error boundaries around major sections:
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <ChatPanel />
</ErrorBoundary>
```

### 3.3 Inconsistent Error Handling
**Files:** Multiple

- `tmdb.ts` — throws errors
- `generator.ts` — returns null on failure
- `pipeline.ts` — catches and returns template responses
- API routes — return generic 500 errors

**Problem:** No consistent error handling strategy. Users get unclear error messages.

**Fix:** Create a unified error handling pattern:
```ts
// types/errors.ts
export class AppError extends Error {
  constructor(message: string, public code: string, public statusCode: number) {
    super(message);
  }
}
```

### 3.4 Missing `<img>` Optimization
**Files:** `SearchBar.tsx:190`, `ShowDetail.tsx:67,80`, `WatchedSection.tsx:47`, `Watchlist.tsx:116`

**Problem:** Using raw `<img>` tags instead of `next/image`. This causes:
- Slower LCP (Largest Contentful Paint)
- No automatic WebP conversion
- No lazy loading
- No size optimization

**Fix:** Replace with `next/image`:
```tsx
import Image from "next/image";
<Image src={getImageUrl(item.posterPath)} alt={item.title} width={45} height={68} />
```

### 3.5 Hardcoded US Region
**File:** `src/lib/tmdb.ts:111,166`

```ts
const usProviders = watchData?.results?.["US"];
```

**Problem:** Streaming providers are hardcoded to US. International users see no providers.

**Fix:** Detect user locale or allow region selection.

---

## 4. LOW Priority Issues

### 4.1 No Offline Support
**File:** `PRODUCT.md:36`

**Claim:** "Must work offline for existing watchlist items"  
**Reality:** No service worker, no offline detection, no cached API responses.

### 4.2 No Accessibility (a11y)
- No ARIA labels on interactive elements
- No keyboard navigation for filter controls
- No screen reader announcements for dynamic content
- No focus management in modals

### 4.3 No SEO Metadata
- No Open Graph tags
- No structured data (JSON-LD)
- No sitemap.xml

### 4.4 Missing Tests
- No integration tests for API routes
- No E2E tests (Playwright/Cypress)
- No component tests (only RAG unit tests)

### 4.5 Bundle Size
- `@huggingface/transformers` is ~50MB (loaded on first RAG operation)
- No code splitting for RAG features

---

## 5. Architecture Recommendations

### 5.1 Current Architecture
```
Client (React 19)
    ↓
API Routes (Next.js)
    ↓
TMDB API ←→ Vector Store (in-memory)
    ↓
Ollama (optional)
```

### 5.2 Recommended Architecture
```
Client (React 19)
    ↓
API Routes (Next.js)
    ↓
┌─────────────────────────────────┐
│  TMDB API (cached)              │
│  PostgreSQL + pgvector          │  ← Persistent vector store
│  Redis (Upstash)                │  ← Rate limiting + caching
│  Ollama (optional)              │
└─────────────────────────────────┘
```

### 5.3 Key Changes
1. **Move TMDB calls to API routes only** (fix API key exposure)
2. **Add PostgreSQL + pgvector** for persistent vector storage
3. **Add Redis** for rate limiting and caching
4. **Add proper error boundaries** and loading states
5. **Implement offline support** with service workers

---

## 6. Priority Matrix

| Issue | Severity | Effort | Impact |
|-------|----------|--------|--------|
| API Key Exposure | Critical | Low | High |
| Rate Limiting | Critical | Medium | High |
| Input Validation | Critical | Low | High |
| Vector Store Persistence | High | High | High |
| N+1 Queries | High | Medium | Medium |
| Caching Layer | High | Medium | High |
| Type Safety | Medium | Low | Medium |
| Error Boundaries | Medium | Low | Medium |
| Image Optimization | Medium | Low | Medium |
| Offline Support | Low | High | Medium |
| Accessibility | Low | High | Medium |
| SEO | Low | Low | Low |

---

## 7. Quick Wins (< 1 hour each)

1. **Remove `NEXT_PUBLIC_` prefix from TMDB key** — 5 minutes
2. **Add query length validation to API routes** — 15 minutes
3. **Extract provider parsing to shared function** — 15 minutes
4. **Replace `<img>` with `next/image`** — 30 minutes
5. **Add error boundary around ChatPanel** — 15 minutes

---

## 8. Conclusion

Plot has a strong foundation and innovative concept (departure board metaphor). The RAG integration is clever and the UI is well-designed. The main risks are:

1. **Security** — API key exposure is a showstopper
2. **Reliability** — In-memory vector store won't work in production
3. **Performance** — No caching means slow repeated loads

Addressing the Critical and High priority items would make this production-ready. The Medium and Low items are quality improvements that can be phased in.
