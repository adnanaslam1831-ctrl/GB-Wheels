import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="List your car or save favourites across GB.">
      <RegisterForm />
    </AuthShell>
  );
}
