import { ConfigNotice } from "@/components/ui/ConfigNotice";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(237,16,38,0.18),transparent_70%)]"
      />
      <div className="container-gb flex min-h-[70dvh] items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wide">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          </div>
          <ConfigNotice className="mb-4" />
          <div className="glass-card p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
