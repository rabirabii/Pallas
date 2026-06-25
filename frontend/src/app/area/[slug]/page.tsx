import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  AreaIntelligenceWorkspace,
  loadAreaDataset,
  loadAreaManifest,
  MarketRecordHeader,
} from "@/features/area-intelligence";
import { absoluteUrl, siteConfig } from "@/shared/config/site";
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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${dataset.metadata.areaName} Rental Intelligence`;
  const description = `${dataset.metadata.areaName} rental market snapshot with ${dataset.metadata.listingCount} listings, ${dataset.metadata.validPriceCount} valid prices, segment rent comparison, and listing-level records.`;
  const canonicalPath = `/area/${dataset.metadata.areaSlug}`;
  const imageUrl = absoluteUrl(`${canonicalPath}/opengraph-image`);

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: absoluteUrl(canonicalPath),
      siteName: siteConfig.name,
      title: `${title} | PALLAS`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${dataset.metadata.areaName} rental market intelligence snapshot`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PALLAS`,
      description,
      images: [imageUrl],
    },
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
