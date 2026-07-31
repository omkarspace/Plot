import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitHeaders, DEFAULT_RATE_LIMIT } from "@/lib/rateLimit";
import { validateServiceIds, validateGenreIds, validateTimeBudget, validateRegion } from "@/lib/validation";
import { discoverContent } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const DISCOVER_RATE_LIMIT = {
  ...DEFAULT_RATE_LIMIT,
  maxRequests: 15,
  windowMs: 60 * 1000,
  keyPrefix: "tmdb:discover",
};

export async function POST(request: NextRequest) {
  const rateLimitResponse = rateLimit(DISCOVER_RATE_LIMIT)(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { serviceIds = [], moodIds = [], timeBudget, region = "US" } = body;

    const validatedServices = validateServiceIds(serviceIds);
    const validatedMoods = validateGenreIds(moodIds);
    const validatedTimeBudget = validateTimeBudget(timeBudget);
    const validatedRegion = validateRegion(region);

    const results = await discoverContent(validatedServices, validatedMoods, validatedRegion);

    let filtered = results;
    if (validatedTimeBudget !== null) {
      filtered = results.filter((r) => (r.totalRuntimeMinutes ?? 0) <= validatedTimeBudget);
    }

    return NextResponse.json(
      { results: filtered, region: validatedRegion },
      { headers: getRateLimitHeaders(DISCOVER_RATE_LIMIT, request) }
    );
  } catch (error) {
    console.error("TMDB discover error:", error);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}