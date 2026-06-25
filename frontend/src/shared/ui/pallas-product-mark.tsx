export function PallasProductMark({ compact = false }: { compact?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        compact
          ? "relative flex h-9 w-7 items-center justify-center"
          : "relative flex h-16 w-11 items-center justify-center"
      }
    >
      <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-strong" />
      <span
        className={
          compact
            ? "absolute top-1 h-4 w-4 border border-secondary-soft bg-surface-raised"
            : "absolute top-2 h-6 w-6 border border-secondary-soft bg-surface-raised"
        }
      />
      <span
        className={
          compact
            ? "absolute bottom-1 h-5 w-[3px] bg-primary"
            : "absolute bottom-2 h-8 w-[3px] bg-primary"
        }
      />
    </span>
  );
}
