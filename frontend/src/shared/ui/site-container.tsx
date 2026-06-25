import type { ReactNode } from "react";

export function SiteContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl px-5">{children}</div>;
}
