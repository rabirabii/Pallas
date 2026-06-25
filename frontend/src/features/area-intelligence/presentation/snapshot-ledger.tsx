"use client";

import { motion } from "framer-motion";

import type { AreaDataset, DatasetManifest } from "@/features/area-intelligence";
import {
  formatDate,
  formatNumber,
  formatPercentage,
  formatRM,
} from "@/shared/formatting/number-format";

type SegmentSignal = {
  segment: string;
  unitCount: number;
  fairPriceRM: number | null;
};

function getDominantSegment(datasets: AreaDataset[]) {
  const segmentCounts = new Map<string, number>();

  for (const dataset of datasets) {
    for (const summary of dataset.summaries) {
      segmentCounts.set(
        summary.segment,
        (segmentCounts.get(summary.segment) ?? 0) + summary.unitCount,
      );
    }
  }

  return [...segmentCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
}

function getFairPriceSignal(datasets: AreaDataset[]): SegmentSignal | null {
  const signals = datasets.flatMap((dataset) =>
    dataset.summaries
      .filter((summary) => summary.fairPriceRM !== null)
      .map((summary) => ({
        segment: `${dataset.metadata.areaName} / ${summary.segment}`,
        unitCount: summary.unitCount,
        fairPriceRM: summary.fairPriceRM,
      })),
  );

  return signals.sort((a, b) => b.unitCount - a.unitCount)[0] ?? null;
}

export function SnapshotLedger({
  manifest,
  datasets,
}: {
  manifest: DatasetManifest;
  datasets: AreaDataset[];
}) {
  const totalListings = manifest.areas.reduce(
    (sum, area) => sum + area.listingCount,
    0,
  );
  const maxListings = Math.max(...manifest.areas.map((area) => area.listingCount));
  const dominantSegment = getDominantSegment(datasets);
  const fairPriceSignal = getFairPriceSignal(datasets);
  const dominantShare = dominantSegment
    ? (dominantSegment[1] / totalListings) * 100
    : null;

  return (
    <section className="border-y border-border py-6">
      <div className="grid gap-7 lg:grid-cols-[0.82fr_1fr] lg:items-end">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.18em] text-foreground-subtle">
            Intelligence Snapshot
          </div>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-none text-foreground sm:text-4xl">
            {formatNumber(totalListings)} listings converted into rental
            market signals.
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-sm text-foreground">
            <span>{formatNumber(manifest.areas.length)} areas</span>
            <span className="text-foreground-subtle">·</span>
            <span>Generated {formatDate(manifest.generatedAt)}</span>
            <span className="text-foreground-subtle">·</span>
            <span>Static snapshot</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-[1fr_0.8fr]">
          <div className="space-y-3">
            {manifest.areas.map((area) => {
              const width = `${Math.max(
                8,
                (area.listingCount / maxListings) * 100,
              )}%`;

              return (
                <motion.div
                  key={area.slug}
                  tabIndex={0}
                  className="group grid grid-cols-[96px_1fr_78px] items-center gap-3 border-b border-border-subtle pb-2 focus-visible:bg-surface/70"
                  whileHover={{ x: 3 }}
                  whileFocus={{ x: 3 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  <div className="truncate font-serif text-xl leading-none text-foreground">
                    {area.name}
                  </div>
                  <div className="h-2 overflow-hidden bg-surface-strong">
                    <motion.div
                      className="h-full bg-secondary"
                      initial={{ width: 0 }}
                      animate={{ width }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-right font-mono text-xs text-foreground-muted">
                    {formatNumber(area.listingCount)}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-3 border-l border-border pl-5 max-md:border-l-0 max-md:pl-0">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
                Dominant Segment
              </div>
              <div className="mt-2 font-serif text-3xl leading-none text-foreground">
                {dominantSegment?.[0] ?? "Not stated"}
              </div>
              <div className="mt-1 font-mono text-xs text-foreground-muted">
                {dominantSegment
                  ? `${formatNumber(dominantSegment[1])} listings · ${formatPercentage(dominantShare)}`
                  : "No segment data"}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-foreground-subtle">
                Fair Price Signal
              </div>
              <div className="mt-2 font-mono text-2xl font-semibold text-primary">
                {formatRM(fairPriceSignal?.fairPriceRM)}
              </div>
              <div className="mt-1 text-sm text-foreground-muted">
                {fairPriceSignal?.segment ?? "Insufficient fair price data"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
