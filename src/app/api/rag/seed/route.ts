import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

let seedingInProgress = false;

export async function POST() {
  if (seedingInProgress) {
    return NextResponse.json({ error: "Seeding already in progress" }, { status: 409 });
  }

  seedingInProgress = true;
  try {
    const { seedKnowledgeBase, getSeedShowCount } = await import("@/lib/rag/seedData");
    const result = await seedKnowledgeBase();
    return NextResponse.json({
      ...result,
      totalAvailable: getSeedShowCount(),
    });
  } catch {
    return NextResponse.json({ error: "Seeding failed" }, { status: 500 });
  } finally {
    seedingInProgress = false;
  }
}

export async function GET() {
  const { getSeedShowCount } = await import("@/lib/rag/seedData");
  return NextResponse.json({ totalAvailable: getSeedShowCount() });
}
