'use client';

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  // The 3D Cube view fills the viewport below the header, so the footer
  // would create an unwanted scrollbar. Hide it on that page.
  if (pathname === "/cube") {
    return null;
  }

  return (
    <footer className="border-t border-border-subtle text-xs text-text-muted px-6 py-8"
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-accent-sea animate-pulse" />
          <span>Triaxis — anonymous community voting</span>
        </div>
        <div className="flex items-center gap-4 text-text-muted"
        >
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#2ec4b6' }} />
            Execution
          </span>
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#ef767a' }} />
            Info
          </span>
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#7d53de' }} />
            Mental
          </span>
        </div>
      </div>
    </footer>
  );
}
