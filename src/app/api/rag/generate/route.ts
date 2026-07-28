import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = generateLocalResponse(prompt);
    return NextResponse.json({ response });
  } catch {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}

function generateLocalResponse(prompt: string): string {
  const lines = prompt.split("\n");
  const lastLine = lines[lines.length - 1] || "";
  const questionMatch = lastLine.match(/User Question:\s*(.+)/i);
  const question = questionMatch ? questionMatch[1].trim() : "";

  const contextLines = lines.filter((l) => l.startsWith("["));
  const titles = contextLines.map((l) => {
    const match = l.match(/\]\s*(.+?):/);
    return match ? match[1] : "";
  }).filter(Boolean);

  const uniqueTitles = [...new Set(titles)];

  if (question.toLowerCase().includes("recommend") || question.toLowerCase().includes("similar")) {
    return `Based on the knowledge base, here are some great picks:\n\n${contextLines.slice(0, 3).map((line, i) => {
      const match = line.match(/\]\s*(.+?):\s*(.+)/);
      return match ? `${i + 1}. **${match[1]}** - ${match[2]}` : "";
    }).filter(Boolean).join("\n")}\n\nWould you like to know more about any of these?`;
  }

  if (uniqueTitles.length > 0) {
    return `Found ${uniqueTitles.length} relevant result${uniqueTitles.length > 1 ? "s" : ""}:\n\n${contextLines.slice(0, 3).map((line) => {
      const match = line.match(/\]\s*(.+?):\s*(.+)/);
      return match ? `• **${match[1]}**: ${match[2]}` : "";
    }).filter(Boolean).join("\n")}`;
  }

  return `I found some relevant information in the knowledge base. Could you rephrase your question to help me find the best matches?`;
}
