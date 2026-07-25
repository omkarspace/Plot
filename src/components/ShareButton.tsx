"use client";

import { useState } from "react";
import { formatRuntime } from "@/lib/time";
import type { WatchlistItem } from "@/types";

interface ShareButtonProps {
  items: WatchlistItem[];
}

export default function ShareButton({ items }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const totalMinutes = items.reduce(
      (sum, item) => sum + item.totalRuntimeMinutes,
      0
    );

    const totalFormatted = formatRuntime(totalMinutes);
    const totalDays = (totalMinutes / 60 / 24).toFixed(1);

    const lines = [
      "\u{1F4CB} My Plot Watchlist",
      "",
      ...items.map(
        (item) =>
          `\u{1F3AC} ${item.title} (${item.type === "tv" ? "TV" : "Movie"}) — ${formatRuntime(item.totalRuntimeMinutes)}`
      ),
      "",
      `Total: ${totalFormatted} (${totalDays} days)`,
    ];

    await navigator.clipboard.writeText(lines.join("\n"));

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
        copied
          ? "bg-green-600 text-white"
          : "bg-[#262626] text-[#737373] hover:bg-[#3b82f6] hover:text-white"
      }`}
    >
      {copied ? "Copied!" : "\u{1F4E4} Share"}
    </button>
  );
}
