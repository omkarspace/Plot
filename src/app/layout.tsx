import type { Metadata } from "next";
import { Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-board",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plot — Departure Board for Your Evening",
  description: "The smartest way to pick what to watch. Filter by time, streaming service, and mood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlow.variable} ${ibmPlex.variable}`} suppressHydrationWarning>
      <body className="min-h-screen" suppressHydrationWarning>
        <nav className="fixed top-0 left-0 right-0 z-50 bg-flap-black border-b border-ruled">
          <div className="max-w-[1100px] mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex gap-[2px]">
                {"PLOT".split("").map((char) => (
                  <span
                    key={char}
                    className="flap-char text-lg w-7 h-9 group-hover:text-delay-amber transition-colors duration-150"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="px-3 py-1.5 text-sm font-medium text-steel-frame hover:text-flap-white uppercase tracking-wider transition-colors font-[family-name:var(--font-board)]"
              >
                Departures
              </Link>
              <Link
                href="/search"
                className="px-3 py-1.5 text-sm font-medium text-steel-frame hover:text-flap-white uppercase tracking-wider transition-colors font-[family-name:var(--font-board)]"
              >
                Search
              </Link>
              <Link
                href="/debug"
                className="px-3 py-1.5 text-sm font-medium text-steel-frame hover:text-flap-white uppercase tracking-wider transition-colors font-[family-name:var(--font-board)]"
              >
                Debug
              </Link>
            </div>
          </div>
        </nav>
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
