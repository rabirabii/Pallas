import type { AreaDataset, RentalTypeInfo } from "@/features/area-intelligence";
import { SectionHeading } from "@/shared/ui/section-heading";
import { StatusBadge } from "@/shared/ui/status-badge";

function statusForRentalType(type: string, info: RentalTypeInfo) {
  if (!info.available) {
    return {
      badge: <StatusBadge tone="unavailable">Unavailable</StatusBadge>,
      description: info.reason ?? "Not available from the source dataset.",
    };
  }

  if (info.derived) {
    return {
      badge: <StatusBadge tone="derived">Derived</StatusBadge>,
      description: info.formula
        ? `Derived from ${info.formula}.`
        : "Derived from available monthly rental data.",
    };
  }

  return {
    badge: <StatusBadge tone="observed">Observed</StatusBadge>,
    description:
      type === "monthly"
        ? "Observed from public SPEEDHOME listing prices."
        : "Observed from the source dataset.",
  };
}

export function RentalAvailability({
  dataset,
  compact = false,
}: {
  dataset: AreaDataset;
  compact?: boolean;
}) {
  const entries = [
    ["daily", "Daily"],
    ["monthly", "Monthly"],
    ["annual", "Annual"],
  ] as const;

  return (
    <section className={compact ? "py-0" : "py-12"}>
      {compact ? (
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.16em] text-accent-dark">
            Rental Availability
          </p>
          <h2 className="mt-2 font-serif text-3xl text-foreground">
            Rental Period Coverage
          </h2>
        </div>
      ) : (
        <SectionHeading
          marker="II."
          eyebrow="Rental Availability"
          title="Rental Period Coverage"
        />
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {entries.map(([key, label]) => {
          const info = dataset.rentalTypes[key];
          const state = statusForRentalType(key, info);

          return (
            <div key={key} className="border-y border-border py-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-serif text-3xl text-foreground">
                  {label}
                </h3>
                {state.badge}
              </div>
              <p className="mt-4 text-sm leading-6 text-foreground-muted">
                {state.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
