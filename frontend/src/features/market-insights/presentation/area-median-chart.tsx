"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import type { LandingMarketIntelligence } from "../application/build-landing-market-intelligence";

import { formatNumber, formatRM } from "@/shared/formatting/number-format";

type AreaDatum = LandingMarketIntelligence["areas"][number];

export function AreaMedianChart({ areas }: { areas: AreaDatum[] }) {
  const reduceMotion = useReducedMotion();
  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const rankedAreas = areas.filter((area) => area.medianMonthlyRentRM !== null);
  const maxMedian = Math.max(
    ...rankedAreas.map((area) => area.medianMonthlyRentRM ?? 0),
    0,
  );

  if (rankedAreas.length === 0) {
    return (
      <div className="border-y border-border py-6 text-sm text-foreground-muted">
        Price comparison is unavailable for the current snapshot.
      </div>
    );
  }

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
        Median Monthly Rent by Area
      </div>
      <div className="mt-1 text-sm text-foreground-muted">
        All observed unit segments
      </div>

      <div className="mt-5 space-y-3">
        {rankedAreas.map((area, index) => {
          const median = area.medianMonthlyRentRM ?? 0;
          const width = `${Math.max(7, (median / maxMedian) * 100)}%`;
          const isFocused = focusedSlug === area.areaSlug;
          const isHighest = index === 0;

          return (
            <Link
              key={area.areaSlug}
              href={`/area/${area.areaSlug}`}
              className="group block focus-visible:bg-surface/70"
              onFocus={() => setFocusedSlug(area.areaSlug)}
              onBlur={() => setFocusedSlug(null)}
              onMouseEnter={() => setFocusedSlug(area.areaSlug)}
              onMouseLeave={() => setFocusedSlug(null)}
              aria-label={`${area.areaName} median monthly rent ${formatRM(median)} from ${formatNumber(area.validPriceCount)} valid prices`}
            >
              <div className="grid grid-cols-[94px_1fr_92px] items-center gap-3">
                <div className="truncate font-serif text-xl leading-none text-foreground">
                  {area.areaName}
                </div>
                <div className="relative h-3 bg-surface-strong">
                  <motion.div
                    className={
                      isHighest || isFocused
                        ? "h-full bg-primary"
                        : "h-full bg-secondary"
                    }
                    initial={{ width: reduceMotion ? width : 0 }}
                    animate={{
                      width,
                      opacity: focusedSlug && !isFocused ? 0.58 : 1,
                      x: isFocused && !reduceMotion ? 4 : 0,
                    }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  />
                </div>
                <div className="text-right font-mono text-xs text-foreground">
                  {formatRM(median)}
                </div>
              </div>
              <motion.div
                initial={false}
                animate={{
                  opacity: isFocused ? 1 : 0.64,
                  y: isFocused && !reduceMotion ? 1 : 0,
                }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className="ml-[107px] mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-foreground-subtle"
              >
                {formatNumber(area.validPriceCount)} valid price samples
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
