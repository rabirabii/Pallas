import { PageShell } from "@/shared/ui/page-shell";
import { SiteContainer } from "@/shared/ui/site-container";

export default function AreaLoading() {
  return (
    <PageShell>
      <SiteContainer>
        <section className="py-20">
          <div className="h-3 w-52 bg-surface-strong" />
          <div className="mt-6 h-16 w-full max-w-xl bg-surface-strong" />
          <div className="mt-6 h-4 w-full max-w-2xl bg-surface-strong" />
        </section>
      </SiteContainer>
    </PageShell>
  );
}
