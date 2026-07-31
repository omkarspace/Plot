import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitHeaders, DEFAULT_RATE_LIMIT } from "@/lib/rateLimit";
import { validateSearchQuery } from "@/lib/validation";
import { searchShows } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const SEARCH_RATE_LIMIT = {
  ...DEFAULT_RATE_LIMIT,
  maxRequests: 30,
  windowMs: 60 * 1000,
  keyPrefix: "tmdb:search",
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimit(SEARCH_RATE_LIMIT)(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const validatedQuery = validateSearchQuery(query);
    const data = await searchShows(validatedQuery);

    const filtered = data.results
      .filter((r) => r.media_type === "tv" || r.media_type === "movie")
      .slice(0, 10);

    return NextResponse.json(
      { results: filtered },
      { headers: getRateLimitHeaders(SEARCH_RATE_LIMIT, request) }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Query must be at least")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("TMDB search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}