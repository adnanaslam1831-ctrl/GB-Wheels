import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

export const metadata: Metadata = { title: "Access denied", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <section className="container-gb flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-3xl uppercase">Access denied</h1>
      <p className="mt-3 max-w-md text-muted">
        Your account does not have permission to use the admin area. If you should have access, ask a Super Admin to assign your role.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="btn-outline">Back to site</Link>
        <form action={logout}><button className="btn-primary">Sign out</button></form>
      </div>
    </section>
  );
}
