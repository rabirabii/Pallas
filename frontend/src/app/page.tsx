import {
  loadAreaDataset,
  loadAreaManifest,
  MarketRegistry,
} from "@/features/area-intelligence";
import {
  buildLandingMarketIntelligence,
  MarketPulse,
} from "@/features/market-insights";
import { AreaSearchBox } from "@/features/property-search";
import { PageShell } from "@/shared/ui/page-shell";
import { PallasProductMark } from "@/shared/ui/pallas-product-mark";
import { SiteContainer } from "@/shared/ui/site-container";

export default async function HomePage() {
  const manifest = await loadAreaManifest();
  const datasets = (
    await Promise.all(
      manifest.areas.map((area) => loadAreaDataset(area.slug)),
    )
  ).filter((dataset) => dataset !== null);
  const intelligence = buildLandingMarketIntelligence(
    datasets,
    manifest.generatedAt,
  );

  return (
    <PageShell>
      <section className="pb-10 pt-14 sm:pt-20">
        <SiteContainer>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(320px,0.52fr)] lg:items-start">
            <div>
              <div className="flex items-start gap-5">
                <div className="hidden sm:block">
                  <PallasProductMark />
                </div>
                <div>
                  <div className="max-w-xl font-mono text-xs uppercase tracking-[0.2em] text-accent-dark">
                    Property Analytics & Listing-Level Assessment System
                  </div>
                  <h1 className="mt-5 font-serif text-7xl font-semibold leading-[0.86] text-foreground sm:text-8xl lg:text-9xl">
                    PALLAS
                  </h1>
                </div>
              </div>

              <p className="mt-8 max-w-xl text-xl leading-8 text-foreground-muted">
                From public rental records to structured market intelligence.
              </p>
            </div>

            <div className="lg:pt-16">
              <AreaSearchBox areas={manifest.areas} />
            </div>
          </div>

          <div className="mt-12">
            <MarketPulse intelligence={intelligence} />
          </div>
        </SiteContainer>
      </section>

      <section className="pb-16">
        <SiteContainer>
          <MarketRegistry areas={manifest.areas} />
        </SiteContainer>
      </section>
    </PageShell>
  );
}
