type StatusBadgeTone = "observed" | "derived" | "unavailable" | "neutral";

const toneClassName: Record<StatusBadgeTone, string> = {
  observed: "border-positive text-positive bg-positive/10",
  derived: "border-accent-dark text-accent-dark bg-accent/10",
  unavailable:
    "border-foreground-subtle text-foreground-muted bg-surface-muted",
  neutral: "border-border-strong text-foreground-muted bg-surface-raised",
};

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: StatusBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-1 font-mono text-[11px] uppercase leading-none tracking-[0.12em] ${toneClassName[tone]}`}
    >
      {children}
    </span>
  );
}
