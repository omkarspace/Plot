# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are streaming enthusiasts who spend too much time scrolling through Netflix, Hulu, Disney+, and other platforms trying to decide what to watch. They want a fast, intelligent way to filter content by time available, mood, and streaming service to find something to watch immediately.

## Product Purpose

Plot eliminates decision paralysis by letting users instantly filter movies and TV shows across streaming services based on how much time they have, what mood they're in, and what platforms they subscribe to. Success means users go from "I have 45 minutes and want something funny" to watching in under 60 seconds.

## Positioning

Plot is the only streaming filter that combines real-time TMDB data, multi-service filtering, and time-budget awareness into a single search. Unlike recommendation engines that learn slowly, Plot works instantly with no history needed.

## Operating Context

Users typically have 5-30 minutes of decision time before their actual viewing window closes. They're often browsing on mobile while waiting, or on desktop while browsing streaming apps. The workflow is: search/browse → filter by time/mood/service → add to watchlist or start watching → track progress for TV shows.

## Capabilities and Constraints

- Real-time search of movies and TV shows via TMDB API
- Smart filtering by time budget, streaming service, and genre/mood
- Watchlist management with persistent local storage
- Episode progress tracking for TV shows
- Share watchlists with others
- Knowledge base for movie/show details
- AI chat panel for recommendations (in development)
- All data stored locally (no user accounts required)
- Must work offline for existing watchlist items

## Brand Commitments

- Name: Plot
- Voice: Direct, confident, slightly witty ("Stop scrolling. Start watching.")
- Identity: Dark, cinematic, focused on getting to the content fast

## Evidence on Hand

- Working Next.js 16 app with React 19, Tailwind CSS 4
- TMDB API integration for search and details
- Local storage for watchlist persistence
- 15 existing components covering search, filtering, watchlist, and detail views

## Product Principles

1. Speed over depth — filter to result in under 3 clicks
2. No accounts required — everything works locally
3. Respect the user's time — show time estimates everywhere
4. Cross-platform filtering — search across all subscribed services at once
5. Cinematic feel — the app should feel like browsing a movie database, not a spreadsheet

## Accessibility & Inclusion

No specific requirements established yet. Basic semantic HTML and color contrast should be maintained.
