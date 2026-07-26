import { NextResponse } from "next/server";
import { isOllamaAvailable, getAvailableModels } from "@/lib/rag/generator";

export const dynamic = "force-dynamic";

export async function GET() {
  const available = await isOllamaAvailable();
  const models = available ? await getAvailableModels() : [];

  return NextResponse.json({
    available,
    models,
    url: process.env.OLLAMA_URL || "http://localhost:11434",
    model: process.env.OLLAMA_MODEL || "llama3.2",
  });
}
