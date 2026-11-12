import { requireRole } from "@/lib/auth";
import { contactReady, siteConfig } from "@/config/site";
import { isBlobConfigured, isDbConfigured, isEmailConfigured } from "@/lib/env";

export const metadata = { title: "Website Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsAdmin() {
  await requireRole(["super_admin"]);
  const c = siteConfig.contact;
  const rows: [string, string, boolean][] = [
    ["Site URL", siteConfig.url, true], ["Database (Neon)", isDbConfigured ? "Connected" : "Not configured", isDbConfigured],
    ["Photo storage (Vercel Blob)", isBlobConfigured ? "Connected" : "Not configured", isBlobConfigured],
    ["Password-reset email (Resend)", isEmailConfigured ? "Enabled" : "Not enabled - use Users > Reset link", isEmailConfigured],
    ["Business phone", c.phone, contactReady.phone], ["WhatsApp", c.whatsapp, contactReady.whatsapp],
    ["Email", c.email, contactReady.email], ["Address", c.address, true],
  ];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">Contact details and site URL are configured through environment variables (<code>.env.local</code> or your Vercel project settings) so that no secret or detail lives in the database. Edit them there and redeploy.</p>
      <dl className="glass-card divide-y divide-border">{rows.map(([k, v, ok]) => (
        <div key={k} className="flex justify-between gap-4 p-3 text-sm"><dt className="text-muted">{k}</dt><dd className={ok ? "" : "text-amber-300"}>{v}{ok ? "" : " (placeholder)"}</dd></div>))}</dl>
      <p className="text-xs text-muted">Brands and districts are defined in <code>src/config/site.ts</code>. Brokerage rules are managed on the Brokerage Rules page.</p>
    </div>
  );
}
