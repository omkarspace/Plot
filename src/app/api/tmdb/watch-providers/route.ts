import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getRateLimitHeaders, DEFAULT_RATE_LIMIT } from "@/lib/rateLimit";
import { validateId, validateMediaType, validateRegion } from "@/lib/validation";
import { getWatchProviders } from "@/lib/tmdb";

export const dynamic = "force-dynamic";

const PROVIDERS_RATE_LIMIT = {
  ...DEFAULT_RATE_LIMIT,
  maxRequests: 30,
  windowMs: 60 * 1000,
  keyPrefix: "tmdb:providers",
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = rateLimit(PROVIDERS_RATE_LIMIT)(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const typeParam = searchParams.get("type");
    const regionParam = searchParams.get("region");

    if (!idParam || !typeParam) {
      return NextResponse.json({ error: "Missing required parameters: id, type" }, { status: 400 });
    }

    const id = validateId(idParam);
    const type = validateMediaType(typeParam);
    const region = validateRegion(regionParam);

    const providers = await getWatchProviders(id, type);

    return NextResponse.json(
      { providers, region },
      { headers: getRateLimitHeaders(PROVIDERS_RATE_LIMIT, request) }
    );
  } catch (error) {
    if (error instanceof Error && (error.message.includes("Invalid") || error.message.includes("Invalid media type"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("TMDB providers error:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}