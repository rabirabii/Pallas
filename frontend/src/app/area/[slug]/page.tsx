import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AreaIntelligenceWorkspace,
  loadAreaDataset,
  loadAreaManifest,
  MarketRecordHeader,
} from "@/features/area-intelligence";
import { PageShell } from "@/shared/ui/page-shell";
import { SiteContainer } from "@/shared/ui/site-container";

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
        <MarketRecordHeader dataset={dataset} />
        <AreaIntelligenceWorkspace dataset={dataset} />
      </SiteContainer>
    </PageShell>
  );
}
