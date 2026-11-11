import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="We'll email you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
