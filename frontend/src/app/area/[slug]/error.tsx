"use client";

import { PageShell } from "@/shared/ui/page-shell";
import { SiteContainer } from "@/shared/ui/site-container";

export default function AreaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageShell>
      <SiteContainer>
        <section className="py-20">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-negative">
            Dataset Error
          </div>
          <h1 className="mt-4 font-serif text-5xl text-foreground">
            Market record could not be loaded
          </h1>
          <p className="mt-4 max-w-2xl text-foreground-muted">
            PALLAS could not parse this static area dataset. The snapshot may be
            missing or malformed.
          </p>
          <p className="mt-4 max-w-2xl font-mono text-xs text-foreground-subtle">
            {error.message}
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-8 border border-primary-strong bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-inverse"
          >
            Try Again
          </button>
        </section>
      </SiteContainer>
    </PageShell>
  );
}
