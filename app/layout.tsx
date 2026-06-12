import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triaxis — Competitive Game Ratings",
  description: "Rate competitive games on Execution, Info, and Mental axes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-900 text-slate-100">
        <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight hover:text-cyan-400 transition-colors">
              Triaxis
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-slate-400 hover:text-slate-100 transition-colors">
                Catalog
              </Link>
              <Link href="/cube" className="text-slate-400 hover:text-slate-100 transition-colors">
                3D Cube
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-800 text-xs text-slate-500 px-6 py-6 text-center">
          Triaxis POC — anonymous voting, dark mode default.
        </footer>
      </body>
    </html>
  );
}
