export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border border-dashed border-border-strong bg-surface px-5 py-8">
      <h3 className="font-serif text-2xl font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">
        {description}
      </p>
    </div>
  );
}
