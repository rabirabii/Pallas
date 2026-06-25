"use client";

import { motion, useReducedMotion } from "framer-motion";

import type { LandingMarketIntelligence } from "../application/build-landing-market-intelligence";

import { formatPercentage, formatRM } from "@/shared/formatting/number-format";

function buildObservationText(
  intelligence: LandingMarketIntelligence,
): string[] {
  const observations: string[] = [];

  if (intelligence.highestMedianArea) {
    observations.push(
      `${intelligence.highestMedianArea.areaName} records the highest observed median monthly rent at ${formatRM(intelligence.highestMedianArea.medianMonthlyRentRM)}.`,
    );
  }

  if (intelligence.dominantSegment) {
    observations.push(
      `${intelligence.dominantSegment.segment} units represent ${formatPercentage(intelligence.dominantSegment.percentage)} of the current observed inventory.`,
    );
  }

  if (intelligence.priceCompletenessPercentage !== null) {
    observations.push(
      `${formatPercentage(intelligence.priceCompletenessPercentage)} of observed listings contain a valid monthly rental price.`,
    );
  }

  return observations.slice(0, 3);
}

export function AnalyticalObservations({
  intelligence,
}: {
  intelligence: LandingMarketIntelligence;
}) {
  const reduceMotion = useReducedMotion();
  const observations = buildObservationText(intelligence);

  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
        Analytical Observations
      </div>

      {observations.length > 0 ? (
        <ul className="mt-5 space-y-4">
          {observations.map((observation, index) => (
            <motion.li
              key={observation}
              className="border-l border-border-strong pl-4 text-sm leading-6 text-foreground-muted"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.24,
                delay: reduceMotion ? 0 : index * 0.05,
                ease: "easeOut",
              }}
            >
              {observation}
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 border-y border-border py-4 text-sm text-foreground-muted">
          Analytical observations are unavailable for the current snapshot.
        </div>
      )}
    </div>
  );
}
