import Link from "next/link";
import { logout } from "@/app/(auth)/actions";

export const metadata = { title: "Account Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-xl space-y-4">
      <h2 className="font-display text-xl uppercase">Account Settings</h2>
      <div className="glass-card space-y-3 p-5 text-sm">
        <p className="text-muted">Change your password by requesting a reset link to your email.</p>
        <Link href="/forgot-password" className="btn-outline">Change password</Link>
      </div>
      <form action={logout}><button className="btn-primary">Sign out</button></form>
    </div>
  );
}
