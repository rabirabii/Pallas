"use client";

import { motion } from "framer-motion";
import Link from "next/link";

import type { ManifestArea } from "@/features/area-intelligence";
import { formatDate, formatNumber } from "@/shared/formatting/number-format";
import { SectionHeading } from "@/shared/ui/section-heading";

const MotionLink = motion.create(Link);

export function MarketRegistry({ areas }: { areas: ManifestArea[] }) {
  return (
    <section>
      <SectionHeading
        marker="II."
        eyebrow="Market Registry"
        title="Available Market Records"
      />

      <div className="mt-6 border-y border-border-strong">
        <div className="hidden grid-cols-[72px_1fr_140px_180px_150px] border-b border-border px-2 py-3 font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle md:grid">
          <div>No.</div>
          <div>Market Area</div>
          <div>Listings</div>
          <div>Snapshot Date</div>
          <div>Action</div>
        </div>

        <ol>
          {areas.map((area, index) => {
            const recordNumber = String(index + 1).padStart(2, "0");

            return (
              <li key={area.slug}>
                <MotionLink
                  href={`/area/${area.slug}`}
                  className="group grid gap-3 border-b border-border px-2 py-5 transition-colors hover:bg-surface/70 focus-visible:bg-surface md:grid-cols-[72px_1fr_140px_180px_150px] md:items-center"
                  aria-label={`Open ${area.name} market record`}
                  whileHover={{ x: 4 }}
                  whileFocus={{ x: 4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="font-mono text-sm text-accent-dark">
                    {recordNumber}
                  </div>
                  <div>
                    <div className="font-serif text-3xl font-semibold leading-none text-foreground">
                      {area.name}
                    </div>
                    <div className="mt-2 text-xs text-foreground-subtle md:hidden">
                      Snapshot: {formatDate(area.scrapedAt)}
                    </div>
                  </div>
                  <div className="font-mono text-sm text-foreground-muted">
                    {formatNumber(area.listingCount)} listings
                  </div>
                  <div className="hidden font-mono text-sm text-foreground-muted md:block">
                    {formatDate(area.scrapedAt)}
                  </div>
                  <motion.div
                    className="font-mono text-xs uppercase tracking-[0.14em] text-primary"
                    initial={false}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    Open Record →
                  </motion.div>
                </MotionLink>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
