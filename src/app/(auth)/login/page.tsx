import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to manage your listings and saved cars.">
      {error === "link" && (
        <p className="mb-4 rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-sm text-red-200">
          That link is invalid or has expired. Please try again.
        </p>
      )}
      <LoginForm next={next} />
    </AuthShell>
  );
}
