import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Choose New Password" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // The emailed link signs the user in via /auth/callback first; without that there is nothing to reset.
  const user = await getCurrentUser();
  return (
    <AuthShell title="Choose a new password">
      {user ? (
        <ResetPasswordForm />
      ) : (
        <p className="text-center text-sm text-muted">
          This page is reached from the link in your reset email.{" "}
          <Link href="/forgot-password" className="text-accent hover:underline">Request a new link</Link>.
        </p>
      )}
    </AuthShell>
  );
}
