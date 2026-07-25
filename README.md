# Plot

Track your watch time. Search TV shows and movies, see total runtime, and build your watchlist — all in one place.

## Features

- **Search** — Find any TV show or movie via TMDB
- **Stats** — See seasons, episodes, total runtime, and ratings
- **Binge Calculator** — Know exactly how long a series will take
- **Watchlist** — Save shows and track total queued time
- **Streaming Providers** — See where it's available to watch
- **Dark Mode** — Easy on the eyes

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

## Tech Stack

- [Next.js](https://nextjs.org) 15 (App Router)
- [React](https://react.dev) 19
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com)
- [TMDB API](https://developer.themoviedb.org) for show/movie data
- localStorage for watchlist persistence

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Main page
│   │   └── globals.css       # Styles
│   ├── components/
│   │   ├── SearchBar.tsx     # Search + autocomplete
│   │   ├── ShowDetail.tsx    # Show/movie detail panel
│   │   ├── Watchlist.tsx     # Watchlist grid
│   │   └── StatsBar.tsx      # Total time display
│   ├── lib/
│   │   ├── tmdb.ts           # TMDB API client
│   │   ├── localStorage.ts   # Watchlist CRUD
│   │   └── time.ts           # Duration formatting
│   └── types/
│       └── index.ts          # TypeScript types
├── public/
│   └── placeholder-poster.svg
├── .env.local                # TMDB API key (not committed)
├── package.json
└── tsconfig.json
```

## Deploy

Deploy to [Vercel](https://vercel.com):

1. Push to GitHub
2. Import on Vercel
3. Add `NEXT_PUBLIC_TMDB_API_KEY` as an environment variable
4. Deploy

## License

MIT
