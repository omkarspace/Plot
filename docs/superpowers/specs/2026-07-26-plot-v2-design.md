# Plot v2 — Design Spec

**Date:** 2026-07-26
**Status:** Approved

## What is Plot v2?

Plot v2 is a complete redesign of the Plot app, transforming it from a basic watchlist tool into the definitive "What should I watch tonight?" app. The core insight: people spend **110 hours/year** (nearly 5 full days) scrolling through streaming services before giving up. Plot v2 solves this with a smart filter that crosses your watchlist with your available time and streaming subscriptions.

## The Problem We Solve

| Problem | How Plot v2 Solves It |
|---------|----------------------|
| 22-min Netflix scroll before giving up | Smart Filter: "I have 2 hours and Netflix" → instant results |
| Watchlists become graveyards | Time-based filtering shows what actually fits tonight |
| "What's on my services?" | Service selector shows only content you can actually watch |
| Manual episode logging kills retention | One-tap progress tracking: "Mark S01E05 watched" |
| No unified progress tracker | Progress bar shows exactly where you left off |
| Decision fatigue by evening | Mood filter narrows choices to match your energy |

## Core Features

### 1. Smart Filter (Hero)
The new primary UI. Three questions:
- **Time budget:** 30min / 1hr / 2hr / No limit
- **Streaming services:** Toggle chips for Netflix, HBO, Disney+, etc.
- **Mood/genre:** Quick filter chips for Action, Comedy, Drama, etc.

Shows filtered results from your watchlist that match all criteria.

### 2. Streaming Service Awareness
Users select which services they're subscribed to. The app shows:
- Which of your watchlist items are available on your services
- Provider badges on search results and filtered results
- "Available on Netflix" badges on show detail

### 3. Smart Time Matching
When you select a time budget:
- Shows that fit your time get a green "Fits your time" badge
- Shows that don't fit are dimmed but still visible
- Total time of filtered results shown

### 4. Progress Tracking
For TV shows:
- Track current season/episode (S01E05)
- One-tap "Mark as watched" advances to next episode
- Progress bar shows % complete
- For movies: simple "Watched" toggle

### 5. Improved Search
- Search history chips when input is focused
- Poster thumbnails in search results
- Rating displayed inline
- Type badge (TV/Movie)

### 6. Better Stats Dashboard
- Total watchlist time
- Total time watched
- Items in watchlist vs watched

## UI Design

### Layout
Single page, dark theme, mobile-first.

```
┌─────────────────────────────────────────────┐
│  Plot                  "Stop scrolling."     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ Smart Filter (Hero) ─────────────────┐  │
│  │  What can I watch right now?          │  │
│  │                                       │  │
│  │  ⏱️ 30m  🕐 1hr  🕑 2hr  ♾️ No limit │  │
│  │                                       │  │
│  │  Netflix  Max  Disney+  Hulu  Prime   │  │
│  │  Apple TV+  Paramount+  Peacock       │  │
│  │                                       │  │
│  │  Action  Comedy  Drama  Horror  ...   │  │
│  │                                       │  │
│  │  ── 5 items match your criteria ──   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ Filtered Results ────────────────────┐  │
│  │ [poster] Breaking Bad     TV  49h     │  │
│  │         ✓ Fits your time  Netflix 98%│  │
│  │ [poster] The Office      TV  32h     │  │
│  │         ✓ Fits your time  Peacock 85%│  │
│  │ [poster] Inception       Movie 2h    │  │
│  │         ✓ Fits your time  Prime  90% │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ Search ─────────────────────────────┐   │
│  │ [Search for a TV show or movie...]   │   │
│  │ Recent: [Breaking Bad] [The Office]  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌─ Show Detail ────────────────────────┐   │
│  │  [Poster]  Breaking Bad              │   │
│  │            TV · 2008-2013            │   │
│  │            ⭐ 9.5/10                 │   │
│  │            5 seasons · 62 episodes   │   │
│  │            49h 36m total             │   │
│  │            ▶ Watch on Netflix        │   │
│  │            [+ Add to Watchlist]      │   │
│  │                                       │   │
│  │  ┌─ Progress ──────────────────────┐  │   │
│  │  │ S02E05 ████████░░ 45%           │  │   │
│  │  │ [Mark S02E05 as watched]        │  │   │
│  │  └─────────────────────────────────┘  │   │
│  └───────────────────────────────────────┘  │
│                                             │
│  ── Your Backlog ──  12 shows · 86h 24m ── │
│                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Poster │ │ Poster │ │ Poster │           │
│  │ Show 1 │ │ Show 2 │ │ Show 3 │           │
│  │ 49h    │ │ 32h    │ │ 8h     │           │
│  │ [x]    │ │ [x]    │ │ [x]    │           │
│  └────────┘ └────────┘ └────────┘           │
└─────────────────────────────────────────────┘
```

### Design Style
- Dark theme (background: #0f0f0f, cards: #1a1a1a)
- Clean sans-serif font (Inter)
- Poster images as visual anchors
- Accent color: blue (#3b82f6) for interactive elements
- Service-specific colors for provider badges
- Responsive: mobile-first, stacked layout on small screens

### Key Interactions
- Smart Filter: immediate feedback as you toggle options
- Time budget: single-select buttons with emoji
- Service chips: multi-select, colored when active
- Mood chips: multi-select, accent blue when active
- Progress: one-tap advance, progress bar animates
- Search: debounced 300ms, history chips on focus

## Technical Architecture

### Project Structure
```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── SmartFilter.tsx         # Hero filter
│   ├── ServiceSelector.tsx     # Streaming service picker
│   ├── MoodFilter.tsx          # Genre/mood filter
│   ├── TimeBudgetSlider.tsx    # Time budget selector
│   ├── FilteredResults.tsx     # Filtered watchlist results
│   ├── SearchBar.tsx           # Improved search
│   ├── ShowDetail.tsx          # Improved detail panel
│   ├── ProgressTracker.tsx     # Episode tracking
│   ├── Watchlist.tsx           # "My Backlog" view
│   ├── WatchedSection.tsx      # Watched items
│   ├── StatsBar.tsx            # Total stats
│   ├── ShareButton.tsx         # Share/export
│   └── EmptyState.tsx          # Contextual empty states
├── lib/
│   ├── tmdb.ts                 # TMDB API client
│   ├── localStorage.ts         # All localStorage CRUD
│   ├── time.ts                 # Duration formatting
│   ├── services.ts             # Streaming service logic
│   └── filter.ts               # Smart filter logic
├── hooks/
│   ├── useSmartFilter.ts       # Filter state + logic
│   ├── useWatchlist.ts         # Watchlist CRUD
│   └── useProgress.ts          # Progress tracking
├── types/
│   └── index.ts                # All TypeScript types
└── data/
    └── services.json           # Streaming service definitions
```

### Dependencies
- `next` (16+) — framework
- `react` + `react-dom` (19+) — UI
- `tailwindcss` (4+) — styling
- No UI library — custom lightweight components
- No state library — React hooks + context

### Environment Variables
```
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

### localStorage Schema
```typescript
// Key: "plot-watchlist"
WatchlistItem[]

// Key: "plot-watched"
WatchedItem[]

// Key: "plot-progress"
ShowProgress[]

// Key: "plot-services"
{ services: string[], updatedAt: number }

// Key: "plot-search-history"
SearchHistoryItem[]
```

## Implementation Phases

### Phase 1: Foundation (Tasks 1-4)
- [ ] New type system
- [ ] Streaming service definitions
- [ ] Smart filter logic
- [ ] localStorage & progress hooks

### Phase 2: Core UI (Tasks 5-7)
- [ ] Smart filter components
- [ ] Progress tracker
- [ ] Empty states

### Phase 3: Integration (Tasks 8-10)
- [ ] Improved SearchBar
- [ ] Improved ShowDetail
- [ ] Main page integration

### Phase 4: Polish (Task 11)
- [ ] Build verification
- [ ] Responsive testing
- [ ] Final commit

## Error Handling
- TMDB API rate limit: show "Try again in X seconds"
- No results: "No shows or movies found for [query]"
- API failure: "Something went wrong. Please try again."
- Empty watchlist: "Your watchlist is empty. Search and add some shows!"
- No filter matches: "Nothing matches your filters. Try adjusting your criteria."

## Performance Considerations
- Debounce search input (300ms)
- Cache TMDB responses in memory (Map)
- Lazy load poster images
- useMemo for filter calculations
- No server-side rendering needed — fully client-side

## Future Enhancements (out of scope for v2)
- User accounts + database for cross-device sync
- Social features (share watchlists, see what friends watch)
- AI-powered recommendations
- Export watchlist as CSV
- PWA support
- "Movie night" mode (plan with friends)
- Subscription cost tracking
