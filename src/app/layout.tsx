import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
