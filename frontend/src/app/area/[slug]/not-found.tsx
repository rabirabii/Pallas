import Link from "next/link";

import { PageShell } from "@/shared/ui/page-shell";
import { SiteContainer } from "@/shared/ui/site-container";

export default function AreaNotFound() {
  return (
    <PageShell>
      <SiteContainer>
        <section className="py-20">
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground-subtle">
            Market Record Unavailable
          </div>
          <h1 className="mt-4 font-serif text-5xl text-foreground">
            Area not in snapshot
          </h1>
          <p className="mt-4 max-w-2xl text-foreground-muted">
            This area is not included in the current PALLAS dataset. Run the
            local scraper or saved HTML snapshot parser to add it.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex border border-primary bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-foreground-inverse"
          >
            Return to Registry
          </Link>
        </section>
      </SiteContainer>
    </PageShell>
  );
}
