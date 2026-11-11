"use client";

import { useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionState = { error?: string; message?: string };

export function SubmitButton({
  children,
  className,
  variant = "primary",
  pendingText,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "outline" | "ghost";
  pendingText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(variant === "primary" ? "btn-primary" : variant === "outline" ? "btn-outline" : "btn-ghost", className)}
    >
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export function Field({
  label,
  name,
  hint,
  error,
  children,
}: {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-accent">{error}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state.error && !state.message) return null;
  const isError = Boolean(state.error);
  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm",
        isError ? "border-accent/50 bg-accent/10 text-red-200" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
      )}
    >
      {isError ? <AlertTriangle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
      <span>{state.error ?? state.message}</span>
    </div>
  );
}
