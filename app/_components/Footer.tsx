'use client';

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  if (pathname === "/cube") {
    return null;
  }

  return (
    <footer className="border-t border-stroke bg-bg-raised text-xs text-ink-muted px-6 py-8 relative z-10"
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2 font-[family-name:var(--font-mono)] uppercase tracking-wider"
        >
          <span className="h-1.5 w-1.5 bg-acid animate-pulse" />
          <span>Triaxis // anonymous community voting</span>
        </div>
        <div className="flex items-center gap-4 text-ink-muted font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider"
        >
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 bg-acid" />
            Execution
          </span>
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 bg-cyan" />
            Info
          </span>
          <span className="flex items-center gap-1.5"
          >
            <span className="h-1.5 w-1.5 bg-red" />
            Mental
          </span>
        </div>
      </div>
    </footer>
  );
}
