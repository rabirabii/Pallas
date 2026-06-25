"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { AreaDataset } from "@/features/area-intelligence";
import { formatRM } from "@/shared/formatting/number-format";
import { EmptyState } from "@/shared/ui/empty-state";
import { SectionHeading } from "@/shared/ui/section-heading";

type ChartDatum = {
  segment: string;
  average: number | null;
  median: number | null;
  fairPrice: number | null;
};

function buildChartData(dataset: AreaDataset): ChartDatum[] {
  return dataset.summaries
    .filter(
      (summary) =>
        summary.averageMonthlyRentRM !== null ||
        summary.medianMonthlyRentRM !== null ||
        summary.fairPriceRM !== null,
    )
    .map((summary) => ({
      segment: summary.segment,
      average: summary.averageMonthlyRentRM,
      median: summary.medianMonthlyRentRM,
      fairPrice: summary.fairPriceRM,
    }));
}

export function SegmentRentChart({
  dataset,
  compact = false,
  selectedSegment,
  onSegmentSelect,
}: {
  dataset: AreaDataset;
  compact?: boolean;
  selectedSegment?: string | null;
  onSegmentSelect?: (segment: string) => void;
}) {
  const data = buildChartData(dataset);
  const reduceMotion = useReducedMotion();

  return (
    <section className={compact ? "py-0" : "py-12"}>
      {compact ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
            Segment Rent Intelligence
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Segment Rent Comparison
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            Average, median, and Fair Price are grouped by observed unit
            segment.
          </p>
        </div>
      ) : (
        <SectionHeading
          marker="V."
          eyebrow="Price Distribution"
          title="Segment Rent Comparison"
        >
          Average, median, and Fair Price are grouped by observed unit segment.
        </SectionHeading>
      )}

      {data.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Chart unavailable"
            description="No valid monthly rental prices are available for this snapshot."
          />
        </div>
      ) : (
        <div
          className={
            compact
              ? "mt-6 h-[340px] border-y border-border-strong py-5"
              : "mt-8 h-[420px] border-y border-border-strong py-6"
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 12, right: 24, left: 12, bottom: 72 }}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="segment"
                angle={-35}
                textAnchor="end"
                height={90}
                tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value) =>
                  `RM ${Number(value).toLocaleString("en-MY")}`
                }
                tick={{ fill: "var(--foreground-muted)", fontSize: 12 }}
                width={88}
              />
              <Tooltip
                formatter={(value) => formatRM(Number(value))}
                contentStyle={{
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--foreground)",
                }}
              />
              <Legend />
              <Bar
                dataKey="average"
                name="Average"
                fill="var(--secondary)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="median"
                name="Median"
                fill="var(--foreground-muted)"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="fairPrice"
                name="Fair Price"
                fill="var(--primary)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && onSegmentSelect ? (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Segment drill-down">
          {data.map((datum) => {
            const active = selectedSegment === datum.segment;

            return (
              <motion.button
                key={datum.segment}
                type="button"
                onClick={() => onSegmentSelect(datum.segment)}
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className={
                  active
                    ? "border border-primary bg-primary px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground-inverse"
                    : "border border-border-strong px-3 py-2 font-mono text-xs uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:border-primary hover:text-primary"
                }
              >
                Inspect {datum.segment}
              </motion.button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
