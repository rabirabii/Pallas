"use client";

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

export function SegmentRentChart({ dataset }: { dataset: AreaDataset }) {
  const data = buildChartData(dataset);

  return (
    <section className="py-12">
      <SectionHeading
        marker="V."
        eyebrow="Price Distribution"
        title="Segment Rent Comparison"
      >
        Average, median, and Fair Price are grouped by observed unit segment.
      </SectionHeading>

      {data.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Chart unavailable"
            description="No valid monthly rental prices are available for this snapshot."
          />
        </div>
      ) : (
        <div className="mt-8 h-[420px] border-y border-border-strong py-6">
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
    </section>
  );
}
