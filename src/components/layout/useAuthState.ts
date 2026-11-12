"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type AuthState = { loading: boolean; signedIn: boolean; isStaff: boolean };

/** UI-only hint about the session (shows Login vs My Account). Protected pages and actions verify on the server. */
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, signedIn: false, isStaff: false });
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { signedIn: false, isStaff: false }))
      .then((d) => !cancelled && setState({ loading: false, signedIn: !!d.signedIn, isStaff: !!d.isStaff }))
      .catch(() => !cancelled && setState({ loading: false, signedIn: false, isStaff: false }));
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return state;
}
