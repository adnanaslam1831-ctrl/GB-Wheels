import { DatabaseZap } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Shown wherever a feature needs Supabase and it has not been configured yet. */
export function ConfigNotice({ className = "" }: { className?: string }) {
  if (isSupabaseConfigured) return null;
  return (
    <div className={`flex items-start gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100 ${className}`}>
      <DatabaseZap className="mt-0.5 size-5 shrink-0" />
      <p>
        <strong className="font-semibold">Database not connected.</strong> Add your Supabase URL and anon key to{" "}
        <code className="rounded bg-black/40 px-1">.env.local</code> and run the migrations in{" "}
        <code className="rounded bg-black/40 px-1">supabase/migrations</code>. Until then, sign-in, listings and forms are disabled.
      </p>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass-card flex flex-col items-center px-6 py-14 text-center">
      <h3 className="font-display text-xl uppercase tracking-wide">{title}</h3>
      {body && <p className="mt-2 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
