import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Plot — Stop Scrolling. Start Watching.",
  description: "The smartest way to pick what to watch. Filter by time, streaming service, and mood.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0f0f0f] text-white min-h-screen`} suppressHydrationWarning>
        <nav className="sticky top-0 z-50 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-[#262626]">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg text-white hover:text-[#3b82f6] transition-colors">
              Plot
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-[#737373] hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/search"
                className="text-sm text-[#737373] hover:text-white transition-colors"
              >
                Search
              </Link>
              <Link
                href="/debug"
                className="text-sm text-[#737373] hover:text-white transition-colors"
              >
                Debug
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
