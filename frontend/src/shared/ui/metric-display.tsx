type MetricDisplayProps = {
  label: string;
  value: string;
  detail?: string;
  emphasis?: boolean;
};

export function MetricDisplay({
  label,
  value,
  detail,
  emphasis = false,
}: MetricDisplayProps) {
  return (
    <div className="border-l border-border-strong pl-4">
      <div className="text-xs uppercase tracking-[0.16em] text-foreground-subtle">
        {label}
      </div>
      <div
        className={
          emphasis
            ? "mt-2 font-serif text-5xl font-semibold leading-none text-primary-strong"
            : "mt-2 font-mono text-2xl font-semibold text-foreground"
        }
      >
        {value}
      </div>
      {detail ? (
        <div className="mt-2 text-sm text-foreground-muted">{detail}</div>
      ) : null}
    </div>
  );
}
