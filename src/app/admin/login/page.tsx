import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Staff Login", robots: { index: false } };

export default function AdminLoginPage() {
  return (
    <AuthShell title="Staff login" subtitle="GB Wheels administrators and agents only.">
      <LoginForm next="/admin" area="admin" />
    </AuthShell>
  );
}
