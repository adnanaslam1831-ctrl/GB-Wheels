"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { agreeToManagedSale } from "@/app/actions/managed";

export function AgreeButton({ id, brokerage, advertised }: { id: string; brokerage: string; advertised: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div>
      <button className="btn-primary" disabled={pending}
        onClick={() => confirm(`I agree to a brokerage fee of ${brokerage} and an advertised price of ${advertised}.`) &&
          start(async () => { const r = await agreeToManagedSale(id); if (!r.ok) setErr(r.error ?? "Failed"); else router.refresh(); })}>
        I agree to these figures
      </button>
      {err && <p className="mt-2 text-xs text-accent" role="alert">{err}</p>}
    </div>
  );
}
