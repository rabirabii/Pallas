import Link from "next/link";
import type { ReactNode } from "react";

import { PallasProductMark } from "./pallas-product-mark";
import { SiteContainer } from "./site-container";
import { AtmosphericBackground } from "./atmospheric-background";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      <AtmosphericBackground />
      <header className="relative z-10 border-b border-border bg-background/88 backdrop-blur-sm">
        <SiteContainer>
          <div className="flex items-center justify-between gap-4 py-3">
            <Link href="/" className="inline-flex min-w-0 items-center gap-3">
              <PallasProductMark compact />
              <span className="min-w-0">
                <span className="block font-serif text-2xl font-semibold leading-none tracking-wide">
                  PALLAS
                </span>
                <span className="block truncate text-xs text-foreground-muted">
                  Malaysia Rental Market Intelligence
                </span>
              </span>
            </Link>

            <nav className="shrink-0 text-sm text-foreground-muted">
              <Link
                className="border-b border-transparent pb-1 transition hover:border-primary hover:text-foreground"
                href="/methodology"
              >
                Methodology
              </Link>
            </nav>
          </div>
        </SiteContainer>
      </header>

      <main className="relative z-10">{children}</main>

      <footer className="relative z-10 border-t border-border py-6">
        <SiteContainer>
          <div className="text-xs leading-6 text-foreground-subtle">
            PALLAS is an independent portfolio project based on publicly
            available rental listing snapshots. It is not affiliated with or
            endorsed by SPEEDHOME or Jendela360.
          </div>
        </SiteContainer>
      </footer>
    </div>
  );
}
