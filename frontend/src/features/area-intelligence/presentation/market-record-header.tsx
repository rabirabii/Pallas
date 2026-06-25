import type { AreaDataset } from "@/features/area-intelligence";
import { formatDate, formatNumber } from "@/shared/formatting/number-format";
import { StatusBadge } from "@/shared/ui/status-badge";

export function MarketRecordHeader({ dataset }: { dataset: AreaDataset }) {
  return (
    <section className="py-8 sm:py-10">
      <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent-dark">
        PALLAS / Market Record
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="font-serif text-5xl leading-none text-foreground sm:text-6xl lg:text-7xl">
            {dataset.metadata.areaName}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-foreground-muted">
            Malaysia Rental Market Intelligence
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <StatusBadge tone="neutral">Snapshot</StatusBadge>
          <StatusBadge tone="observed">
            {formatNumber(dataset.metadata.validPriceCount)} valid prices
          </StatusBadge>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-border py-4 font-mono text-sm text-foreground-muted">
        <span>{formatNumber(dataset.metadata.listingCount)} listings</span>
        <span aria-hidden="true">·</span>
        <span>{dataset.metadata.currency}</span>
        <span aria-hidden="true">·</span>
        <span>{dataset.metadata.sizeUnit}</span>
        <span aria-hidden="true">·</span>
        <span>Collected {formatDate(dataset.metadata.scrapedAt)}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border pb-5">
        <a
          href={dataset.metadata.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex border-b border-primary pb-1 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-primary transition-colors hover:text-foreground"
        >
          Open source record →
        </a>
        {/* <Link
          href={`/area/${dataset.metadata.areaSlug}?view=data`}
          className="inline-flex items-center gap-2 border border-primary-strong bg-primary px-4 py-2 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-foreground-inverse transition-colors hover:bg-primary-strong"
        >
          <Download className="size-3.5" aria-hidden="true" />
          Export dataset
        </Link> */}
      </div>
    </section>
  );
}
