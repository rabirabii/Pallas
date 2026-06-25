import type { AreaDataset } from "@/features/area-intelligence";
import { buildAreaObservations } from "@/features/market-insights/application/build-area-observations";
import { SectionHeading } from "@/shared/ui/section-heading";

export function AreaObservations({ dataset }: { dataset: AreaDataset }) {
  const observations = buildAreaObservations(dataset);

  return (
    <section className="py-12">
      <SectionHeading
        marker="VI."
        eyebrow="Analytical Observations"
        title="Automated Observations"
      >
        Evidence-based notes from the current listing sample. These are not
        investment recommendations or official valuations.
      </SectionHeading>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {observations.map((observation) => (
          <li
            key={observation}
            className="border-l border-border-strong bg-surface/50 px-5 py-4 text-sm leading-6 text-foreground-muted"
          >
            {observation}
          </li>
        ))}
      </ul>
    </section>
  );
}
