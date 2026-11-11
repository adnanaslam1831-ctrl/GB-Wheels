import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  draft: "bg-zinc-700/50 text-zinc-200", pending: "bg-amber-500/20 text-amber-300",
  active: "bg-emerald-500/20 text-emerald-300", rejected: "bg-red-500/20 text-red-300",
  reserved: "bg-sky-500/20 text-sky-300", sold: "bg-violet-500/20 text-violet-300", expired: "bg-zinc-700/50 text-zinc-300",
  new: "bg-sky-500/20 text-sky-300", completed: "bg-emerald-500/20 text-emerald-300",
  unsuccessful: "bg-red-500/20 text-red-300", cancelled: "bg-red-500/20 text-red-300",
  agreed: "bg-emerald-500/20 text-emerald-300", requested: "bg-amber-500/20 text-amber-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded px-2 py-0.5 text-xs font-semibold capitalize", tone[status] ?? "bg-surface-2 text-fg")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
