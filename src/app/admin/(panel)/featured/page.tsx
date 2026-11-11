import { EmptyState } from "@/components/ui/ConfigNotice";
import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { toggleFeatured } from "@/app/actions/admin";
import { formatPKR } from "@/lib/utils";

export const metadata = { title: "Featured Cars" };
export const dynamic = "force-dynamic";

export default async function FeaturedPage() {
  await requireRole(["super_admin", "listing_manager"]);
  const s = (await getSupabase())!;
  const { data } = await s.from("vehicles").select("id,brand,model,model_year,advertised_price,is_featured,reference").eq("status", "active").order("is_featured", { ascending: false }).order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Only active listings can be featured. Featured cars appear in the homepage Featured section.</p>
      {rows.length === 0 ? <EmptyState title="No active listings" /> : rows.map((v) => (
        <div key={v.id} className="glass-card flex items-center justify-between gap-3 p-3 text-sm">
          <div><p className="font-semibold">{v.brand} {v.model} {v.model_year}</p><p className="text-xs text-muted">{v.reference} · {formatPKR(v.advertised_price)}</p></div>
          <form action={toggleFeatured}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="on" value={String(!v.is_featured)} />
            <button className={v.is_featured ? "btn-primary !min-h-9" : "btn-outline !min-h-9"}>{v.is_featured ? "Featured" : "Feature"}</button></form>
        </div>))}
    </div>
  );
}
