import type { ReactNode } from "react";

type SectionHeadingProps = {
  marker: string;
  title: string;
  eyebrow?: string;
  children?: ReactNode;
};

export function SectionHeading({
  marker,
  title,
  eyebrow,
  children,
}: SectionHeadingProps) {
  return (
    <div className="border-b border-border pb-4">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-accent-dark">{marker}</span>
        {eyebrow ? (
          <span className="text-xs uppercase tracking-[0.18em] text-foreground-subtle">
            {eyebrow}
          </span>
        ) : null}
      </div>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground">
        {title}
      </h2>
      {children ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
          {children}
        </p>
      ) : null}
    </div>
  );
}
