"use client";

import { useState } from "react";
import { createResetLink } from "@/app/actions/admin";

/** Super Admin only: creates a one-hour, single-use password reset link to pass to the user directly. */
export function ResetLink({ userId }: { userId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true); setErr(null);
    const r = await createResetLink(userId);
    setBusy(false);
    if (r.ok) setLink(r.link); else setErr(r.error);
  }
  return (
    <div className="w-full text-xs">
      <button type="button" onClick={go} disabled={busy} className="text-accent hover:underline">{busy ? "Creating..." : "Create reset link"}</button>
      {err && <p className="mt-1 text-red-300">{err}</p>}
      {link && (
        <div className="mt-1 space-y-1">
          <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="input !min-h-8 w-full font-mono text-[11px]" />
          <p className="text-muted">Valid for 1 hour, works once. Send it to the user yourself.</p>
        </div>
      )}
    </div>
  );
}
