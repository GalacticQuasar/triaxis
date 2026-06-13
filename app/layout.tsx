import type { Metadata } from "next";
import { Rajdhani, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Footer } from "./_components/Footer";

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${rajdhani.variable} ${jakartaSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground"
      >
        {/* Noise texture overlay */}
        <div className="noise-overlay" />

        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-background/80 backdrop-blur-xl"
        >
          <nav className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4"
          >
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
            >
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-surface-raised border border-border-default"
              >
                <div className="absolute inset-0 rounded-lg bg-accent-sea/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-sea"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <span className="font-[family-name:var(--font-rajdhani)] text-lg font-semibold tracking-wide uppercase text-text-primary"
              >
                Triaxis
              </span>
            </Link>

            <div className="flex items-center gap-1 text-sm ml-auto"
            >
              <NavLink href="/" label="Catalog" />
              <NavLink href="/cube" label="3D Cube" />
            </div>
          </nav>
        </header>

        <main className="flex-1 pt-16">{children}</main>

        <Footer />
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="relative px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group"
    >
      {label}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-0 bg-accent-sea group-hover:w-[calc(100%-24px)] transition-all duration-300" />
    </Link>
  );
}
