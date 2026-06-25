import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AreaMarketOverview,
  loadAreaDataset,
  loadAreaManifest,
  PriceSummaryTable,
  RentalAvailability,
} from "@/features/area-intelligence";
import {
  formatDateTime,
  formatNumber,
} from "@/shared/formatting/number-format";
import { PageShell } from "@/shared/ui/page-shell";
import { SiteContainer } from "@/shared/ui/site-container";
import { StatusBadge } from "@/shared/ui/status-badge";
import { ListingRegistryTable } from "@/features/listing-explorer/presentation/listing-registry-table";
import { AreaObservations } from "@/features/market-insights/presentation/area-observations";
import { SegmentRentChart } from "@/features/market-insights/presentation/segment-rent-chart";
import { DatasetDownloads } from "@/features/dataset-export/presentation/dataset-downloads";

type AreaPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const manifest = await loadAreaManifest();

  return manifest.areas.map((area) => ({
    slug: area.slug,
  }));
}

export async function generateMetadata({
  params,
}: AreaPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dataset = await loadAreaDataset(slug);

  if (!dataset) {
    return {
      title: "Area not found | PALLAS",
    };
  }

  return {
    title: `${dataset.metadata.areaName} | PALLAS Market Record`,
    description: `Rental market intelligence snapshot for ${dataset.metadata.areaName}.`,
  };
}

export default async function AreaPage({ params }: AreaPageProps) {
  const { slug } = await params;
  const dataset = await loadAreaDataset(slug);

  if (!dataset) {
    notFound();
  }

  return (
    <PageShell>
      <SiteContainer>
        <section className="py-14 sm:py-20">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-accent-dark">
            PALLAS / Market Record
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="font-serif text-6xl leading-none text-foreground sm:text-7xl">
                {dataset.metadata.areaName}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground-muted">
                Malaysia rental market intelligence based on public SPEEDHOME
                listing snapshots.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <StatusBadge tone="neutral">Snapshot</StatusBadge>
              <StatusBadge tone="observed">
                {formatNumber(dataset.metadata.validPriceCount)} valid prices
              </StatusBadge>
            </div>
          </div>

          <dl className="mt-10 grid gap-4 border-y border-border py-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Listings
              </dt>
              <dd className="mt-2 font-mono text-2xl text-foreground">
                {formatNumber(dataset.metadata.listingCount)}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Currency
              </dt>
              <dd className="mt-2 font-mono text-2xl text-foreground">
                {dataset.metadata.currency}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Size Unit
              </dt>
              <dd className="mt-2 font-mono text-2xl text-foreground">
                {dataset.metadata.sizeUnit}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-xs uppercase tracking-[0.14em] text-foreground-subtle">
                Snapshot Time
              </dt>
              <dd className="mt-2 font-mono text-sm text-foreground">
                {formatDateTime(dataset.metadata.scrapedAt)}
              </dd>
            </div>
          </dl>

          <a
            href={dataset.metadata.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex border-b border-primary pb-1 text-sm font-semibold text-primary"
          >
            Open original SPEEDHOME area page →
          </a>
        </section>
        <AreaMarketOverview dataset={dataset} />
        <RentalAvailability dataset={dataset} />
        <PriceSummaryTable dataset={dataset} />
        <ListingRegistryTable
          listings={dataset.listings}
          areaName={dataset.metadata.areaName}
        />
        <SegmentRentChart dataset={dataset} />
        <AreaObservations dataset={dataset} />
        <DatasetDownloads dataset={dataset} />
      </SiteContainer>
    </PageShell>
  );
}
