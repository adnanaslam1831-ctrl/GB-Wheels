"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type AuthState = { loading: boolean; signedIn: boolean; isStaff: boolean };

/**
 * UI-only hint about the current session (to show Login vs Dashboard).
 * It grants nothing: protected pages and server actions verify on the server.
 */
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ loading: true, signedIn: false, isStaff: false });

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      queueMicrotask(() => setState({ loading: false, signedIn: false, isStaff: false }));
      return;
    }
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase!.auth.getSession();
      const user = data.session?.user;
      let isStaff = false;
      if (user) {
        const { data: p } = await supabase!.from("profiles").select("role").eq("id", user.id).maybeSingle();
        isStaff = !!p && p.role !== "user";
      }
      if (!cancelled) setState({ loading: false, signedIn: !!user, isStaff });
    }

    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
