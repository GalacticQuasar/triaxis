import type { Metadata } from "next";
import { Chakra_Petch, JetBrains_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Footer } from "./_components/Footer";

const chakra = Chakra_Petch({
  variable: "--font-chakra",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const bebas = Bebas_Neue({
  variable: "--font-dharma",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "TRIAXIS // Competitive Game Rankings",
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
      className={`${chakra.variable} ${jetbrains.variable} ${bebas.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        {/* texture overlays */}
        <div className="scanlines" />
        <div className="noise-overlay" />

        <header className="fixed top-0 left-0 right-0 z-50 border-b border-stroke bg-bg/95 backdrop-blur-[2px]">
          <nav className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-9 w-9 items-center justify-center border border-stroke bg-panel">
                <span
                  className="absolute inset-0 bg-acid/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-hidden
                />
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                  className="text-acid"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <span className="font-[family-name:var(--font-dharma)] text-3xl font-black uppercase tracking-wide text-ink leading-none">
                TRIAXIS
              </span>
            </Link>

            <div className="flex items-center gap-1 text-sm ml-auto">
              <NavLink href="/" label="Catalog" />
              <NavLink href="/cube" label="3D_Cube" />
            </div>
          </nav>
        </header>

        <main className="flex-1 pt-16 relative z-10">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="glitch-link px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
      {label}
    </Link>
  );
}
