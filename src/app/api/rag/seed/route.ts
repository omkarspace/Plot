import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const { seedKnowledgeBase, getSeedShowCount } = await import("@/lib/rag/seedData");
    const result = await seedKnowledgeBase();
    return NextResponse.json({
      ...result,
      totalAvailable: getSeedShowCount(),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const { getSeedShowCount } = await import("@/lib/rag/seedData");
  return NextResponse.json({ totalAvailable: getSeedShowCount() });
}
