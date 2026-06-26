"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Database, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { AreaDataset, PriceSummary } from "@/features/area-intelligence/domain/contracts";
import { selectPrimarySummary } from "@/features/area-intelligence/application/select-primary-summary";
import {
  MetricExplanation,
  MetricExplanationDialog,
} from "@/features/area-intelligence/presentation/metric-explanation-dialog";
import { AreaMarketOverview } from "@/features/area-intelligence/presentation/area-market-overview";
import { PriceSummaryTable } from "@/features/area-intelligence/presentation/price-summary-table";
import { RentalAvailability } from "@/features/area-intelligence/presentation/rental-availability";
import { DatasetDownloads } from "@/features/dataset-export";
import { ListingRegistryTable } from "@/features/listing-explorer";
import { AreaObservations } from "@/features/market-insights/presentation/area-observations";
import { SegmentRentChart } from "@/features/market-insights/presentation/segment-rent-chart";
import {
  formatNumber,
  formatPercentage,
  formatRM,
  formatSqft,
} from "@/shared/formatting/number-format";

type WorkspaceView = "overview" | "listings" | "insights" | "data";
type ExplanationKey = "fairPrice" | "confidence" | "mode" | "dataQuality";

const workspaceViews: Array<{
  id: WorkspaceView;
  label: string;
}> = [
  { id: "overview", label: "Overview" },
  { id: "listings", label: "Listings" },
  { id: "insights", label: "Insights" },
  { id: "data", label: "Data" },
];

function normalizeView(value: string | null | undefined): WorkspaceView {
  return workspaceViews.some((view) => view.id === value)
    ? (value as WorkspaceView)
    : "overview";
}

function updateAreaUrl(view: WorkspaceView, segment: string | null) {
  const url = new URL(window.location.href);

  if (view === "overview") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", view);
  }

  if (segment && (view === "listings" || view === "insights")) {
    url.searchParams.set("segment", segment);
  } else {
    url.searchParams.delete("segment");
  }

  window.history.replaceState(null, "", url);
}

function WorkspacePanel({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <div hidden={!active} className="min-w-0">
      {active ? (
        <motion.div
          className="min-w-0"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.22 }}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </div>
  );
}

function CompactMetric({
  label,
  value,
  detail,
  emphasis = false,
  onExplain,
}: {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
  onExplain?: () => void;
}) {
  return (
    <div className="border-l border-border-strong pl-4">
      <div className="flex items-center gap-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground-subtle">
          {label}
        </p>
        {onExplain ? (
          <button
            type="button"
            onClick={onExplain}
            className="inline-flex size-5 items-center justify-center border border-border text-[11px] text-foreground-muted transition-colors hover:border-primary hover:text-primary"
            aria-label={`Explain ${label}`}
          >
            i
          </button>
        ) : null}
      </div>
      <p
        className={
          emphasis
            ? "mt-2 font-serif text-4xl leading-none text-primary-strong"
            : "mt-2 font-mono text-xl text-foreground"
        }
      >
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-sm text-foreground-muted">{detail}</p>
      ) : null}
    </div>
  );
}

function SegmentDrawer({
  summary,
  onClose,
  onViewListings,
}: {
  summary: PriceSummary | null;
  onClose: () => void;
  onViewListings: (segment: string) => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {summary ? (
        <motion.div
          className="fixed inset-0 z-50 bg-foreground/35"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="segment-drawer-title"
            className="absolute bottom-0 right-0 h-[82vh] w-full border-l border-border-strong bg-surface-raised p-6 shadow-2xl sm:h-full sm:max-w-md"
            initial={{
              opacity: 0,
              x: reduceMotion ? 0 : 24,
              y: reduceMotion ? 0 : 16,
            }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              x: reduceMotion ? 0 : 24,
              y: reduceMotion ? 0 : 16,
            }}
            transition={{ duration: reduceMotion ? 0.01 : 0.24 }}
          >
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
                  Segment Drill-Down
                </p>
                <h2
                  id="segment-drawer-title"
                  className="mt-3 font-serif text-4xl text-foreground"
                >
                  {summary.segment}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close segment drill-down"
                className="inline-flex size-10 items-center justify-center border border-border-strong text-foreground-muted transition-colors hover:border-primary hover:text-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <dl className="mt-8 grid gap-3 border-y border-border py-4">
              {[
                ["Listings", formatNumber(summary.unitCount)],
                ["Average Rent", formatRM(summary.averageMonthlyRentRM)],
                ["Median Rent", formatRM(summary.medianMonthlyRentRM)],
                ["Fair Price", formatRM(summary.fairPriceRM)],
                ["Average Size", formatSqft(summary.averageSizeSqft)],
                ["Data Confidence", summary.dataConfidence],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[1fr_auto] gap-4 text-sm"
                >
                  <dt className="text-foreground-muted">{label}</dt>
                  <dd className="font-mono text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={() => onViewListings(summary.segment)}
              className="mt-6 inline-flex w-full items-center justify-center border border-primary-strong bg-primary px-5 py-3 font-mono text-xs uppercase tracking-[0.14em] text-foreground-inverse transition-colors hover:bg-primary-strong"
            >
              View matching listings
            </button>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function buildExplanation(
  key: ExplanationKey,
  dataset: AreaDataset,
  primarySummary: PriceSummary | null,
): MetricExplanation {
  if (key === "fairPrice") {
    return {
      title: "Fair Price",
      description:
        "Estimated representative monthly rent based on the available segment sample after outlier-aware processing in the backend pipeline.",
      facts: [
        {
          label: "Segment sample",
          value: primarySummary?.segment ?? "Not stated",
        },
        {
          label: "Valid prices",
          value: formatNumber(primarySummary?.validPriceCount),
        },
        {
          label: "Outliers detected",
          value: formatNumber(primarySummary?.outlierCount),
        },
        {
          label: "Estimated Fair Price",
          value: formatRM(primarySummary?.fairPriceRM),
        },
      ],
    };
  }

  if (key === "mode") {
    return {
      title: "Mode",
      description:
        "The most repeated monthly rental price within a segment. When no price repeats, the mode is reported as unavailable rather than forced.",
      facts: [
        {
          label: "Primary segment",
          value: primarySummary?.segment ?? "Not stated",
        },
        {
          label: "Mode status",
          value: primarySummary?.modeStatus ?? "Not stated",
        },
        {
          label: "Mode rent",
          value: formatRM(primarySummary?.modeMonthlyRentRM),
        },
      ],
    };
  }

  if (key === "dataQuality") {
    return {
      title: "Data Quality",
      description:
        "Quality counts are generated from the static cleaned snapshot and identify missing values or parser warnings without hiding records from inspection.",
      facts: [
        {
          label: "Missing price",
          value: formatNumber(dataset.qualityReport.missingPriceCount),
        },
        {
          label: "Missing size",
          value: formatNumber(dataset.qualityReport.missingSizeCount),
        },
        {
          label: "Unknown furnishing",
          value: formatNumber(dataset.qualityReport.unknownFurnishingCount),
        },
        {
          label: "Warnings",
          value: formatNumber(dataset.qualityReport.warningCount),
        },
      ],
    };
  }

  return {
    title: "Data Confidence",
    description:
      "Confidence reflects available sample size for the selected segment. It is not an appraisal certainty score or investment recommendation.",
    facts: [
      {
        label: "Primary segment",
        value: primarySummary?.segment ?? "Not stated",
      },
      {
        label: "Valid prices",
        value: formatNumber(primarySummary?.validPriceCount),
      },
      {
        label: "Confidence",
        value: primarySummary?.dataConfidence ?? "Not stated",
      },
    ],
  };
}

export function AreaIntelligenceWorkspace({
  dataset,
}: {
  dataset: AreaDataset;
}) {
  const [activeView, setActiveView] = useState<WorkspaceView>("overview");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [segmentFilterNonce, setSegmentFilterNonce] = useState(0);
  const [explanationKey, setExplanationKey] = useState<ExplanationKey | null>(
    null,
  );
  const [segmentDrawerSummary, setSegmentDrawerSummary] =
    useState<PriceSummary | null>(null);

  const primarySummary = useMemo(() => selectPrimarySummary(dataset), [dataset]);
  const explanation = explanationKey
    ? buildExplanation(explanationKey, dataset, primarySummary)
    : null;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const nextView = normalizeView(url.searchParams.get("view"));
      const nextSegment = url.searchParams.get("segment");

      setActiveView(nextView);
      setSelectedSegment(nextSegment);

      if (nextSegment) {
        setSegmentFilterNonce((current) => current + 1);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function setWorkspace(view: WorkspaceView, segment = selectedSegment) {
    setActiveView(view);
    updateAreaUrl(view, segment);
  }

  function handleSegmentSelect(segment: string) {
    const summary =
      dataset.summaries.find((item) => item.segment === segment) ?? null;

    setSelectedSegment(segment);
    setSegmentDrawerSummary(summary);
    updateAreaUrl(activeView === "overview" ? "insights" : activeView, segment);
  }

  function viewListingsForSegment(segment: string) {
    setSelectedSegment(segment);
    setSegmentFilterNonce((current) => current + 1);
    setSegmentDrawerSummary(null);
    setActiveView("listings");
    updateAreaUrl("listings", segment);
  }

  return (
    <div className="pb-14">
      <section className="grid gap-6 border-y border-border-strong py-6 lg:grid-cols-[0.95fr_1.05fr]">
        <AreaMarketOverview
          dataset={dataset}
          compact
          onExplainMetric={setExplanationKey}
        />
        <SegmentRentChart
          dataset={dataset}
          compact
          selectedSegment={selectedSegment}
          onSegmentSelect={handleSegmentSelect}
        />
      </section>

      <div className="mt-8">
        <div
          role="tablist"
          aria-label="Area intelligence workspace"
          className="flex gap-2 overflow-x-auto border-b border-border"
        >
          {workspaceViews.map((view) => {
            const active = activeView === view.id;

            return (
              <button
                key={view.id}
                id={`workspace-tab-${view.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`workspace-panel-${view.id}`}
                onClick={() => setWorkspace(view.id)}
                className="relative px-4 py-4 font-mono text-xs uppercase tracking-[0.14em] text-foreground-muted transition-colors hover:text-primary aria-selected:text-foreground"
              >
                {active ? (
                  <motion.span
                    layoutId="workspace-active-indicator"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                  />
                ) : null}
                {view.label}
              </button>
            );
          })}
        </div>

        <div
          id="workspace-panel-overview"
          role="tabpanel"
          aria-labelledby="workspace-tab-overview"
          className="min-w-0 pt-8"
        >
          <WorkspacePanel active={activeView === "overview"}>
            <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CompactMetric
                label="Median Rent"
                value={formatRM(primarySummary?.medianMonthlyRentRM)}
                detail={primarySummary?.segment}
                emphasis
              />
              <CompactMetric
                label="Fair Price"
                value={formatRM(primarySummary?.fairPriceRM)}
                detail="Representative estimate"
                onExplain={() => setExplanationKey("fairPrice")}
              />
              <CompactMetric
                label="Average Size"
                value={formatSqft(primarySummary?.averageSizeSqft)}
              />
              <CompactMetric
                label="Confidence"
                value={primarySummary?.dataConfidence ?? "Not stated"}
                onExplain={() => setExplanationKey("confidence")}
              />
            </div>

            <div className="grid min-w-0 gap-10">
              <RentalAvailability dataset={dataset} compact />
              <PriceSummaryTable dataset={dataset} compact />
            </div>
          </WorkspacePanel>
        </div>

        <div
          id="workspace-panel-listings"
          role="tabpanel"
          aria-labelledby="workspace-tab-listings"
          className="pt-8"
        >
          <WorkspacePanel active={activeView === "listings"}>
            {selectedSegment ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-muted">
                  Segment context · {selectedSegment}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSegment(null);
                    setSegmentFilterNonce((current) => current + 1);
                    updateAreaUrl("listings", null);
                  }}
                  className="font-mono text-xs uppercase tracking-[0.14em] text-primary"
                >
                  Clear segment context
                </button>
              </div>
            ) : null}
            <ListingRegistryTable
              listings={dataset.listings}
              areaName={dataset.metadata.areaName}
              scrapedAt={dataset.metadata.scrapedAt}
              segmentFilter={selectedSegment}
              segmentFilterNonce={segmentFilterNonce}
            />
          </WorkspacePanel>
        </div>

        <div
          id="workspace-panel-insights"
          role="tabpanel"
          aria-labelledby="workspace-tab-insights"
          className="pt-8"
        >
          <WorkspacePanel active={activeView === "insights"}>
            <div className="mb-6 flex flex-wrap items-center gap-3 border-y border-border py-3">
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Metric: Median Rent
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Segment: {selectedSegment ?? "All Segments"}
              </span>
            </div>
            <AreaObservations dataset={dataset} />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {dataset.marketInsights.furnishingBreakdown.map((item) => (
                <div key={item.furnishing} className="border-y border-border py-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                    {item.furnishing}
                  </p>
                  <p className="mt-2 font-mono text-2xl text-foreground">
                    {formatPercentage(item.listingSharePercentage)}
                  </p>
                  <p className="mt-2 text-sm text-foreground-muted">
                    {formatNumber(item.listingCount)} listings · median{" "}
                    {formatRM(item.medianMonthlyRentRM)}
                  </p>
                </div>
              ))}
            </div>
          </WorkspacePanel>
        </div>

        <div
          id="workspace-panel-data"
          role="tabpanel"
          aria-labelledby="workspace-tab-data"
          className="pt-8"
        >
          <WorkspacePanel active={activeView === "data"}>
            <div className="mb-7 grid gap-4 border-y border-border py-5 md:grid-cols-4">
              <CompactMetric
                label="Data Mode"
                value={dataset.metadata.dataMode}
              />
              <CompactMetric
                label="Methodology"
                value={dataset.metadata.methodologyVersion}
              />
              <CompactMetric
                label="Price Complete"
                value={formatPercentage(
                  dataset.marketInsights.dataCompleteness
                    .priceCompletenessPercentage,
                )}
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setExplanationKey("dataQuality")}
                  className="inline-flex items-center gap-2 border border-border-strong px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <Database className="size-4" aria-hidden="true" />
                  View Data Quality
                </button>
              </div>
            </div>
            <DatasetDownloads dataset={dataset} compact />
            <div className="mt-8 border-y border-border py-5 text-sm leading-6 text-foreground-muted">
              <p>
                Source data is a static public rental listing snapshot from
                SPEEDHOME. PALLAS does not fetch listing pages at runtime and
                does not bypass access controls.
              </p>
              <Link
                href="/methodology"
                className="mt-4 inline-flex border-b border-primary pb-1 font-mono text-xs uppercase tracking-[0.14em] text-primary"
              >
                View methodology →
              </Link>
            </div>
          </WorkspacePanel>
        </div>
      </div>

      <MetricExplanationDialog
        explanation={explanation}
        onClose={() => setExplanationKey(null)}
      />
      <SegmentDrawer
        summary={segmentDrawerSummary}
        onClose={() => setSegmentDrawerSummary(null)}
        onViewListings={viewListingsForSegment}
      />
    </div>
  );
}
