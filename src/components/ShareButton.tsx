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
      "PLOT — DEPARTURE BOARD",
      "━━━━━━━━━━━━━━━━━━━━━━",
      "",
      ...items.map(
        (item) =>
          `${formatRuntime(item.totalRuntimeMinutes).padEnd(8)} ${item.title.toUpperCase().padEnd(24)} ${item.type === "tv" ? "TV" : "MOV"}`
      ),
      "",
      "━━━━━━━━━━━━━━━━━━━━━━",
      `TOTAL: ${totalFormatted} (${totalDays} days)`,
    ];

    await navigator.clipboard.writeText(lines.join("\n"));

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`px-4 py-2 text-xs uppercase tracking-wider font-[family-name:var(--font-board)] font-medium transition-colors ${
        copied
          ? "bg-delay-amber text-flap-black"
          : "border border-ruled text-steel-frame hover:border-delay-amber hover:text-delay-amber"
      }`}
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
