import { requireRole } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase/server";
import { updateUser } from "@/app/actions/admin";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Manage Users" };
export const dynamic = "force-dynamic";
const roles = ["user", "photographer", "sales_agent", "listing_manager", "super_admin"];

export default async function UsersPage() {
  await requireRole(["super_admin"]);
  const s = (await getSupabase())!;
  const { data } = await s.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  return (
    <div className="space-y-3">
      {(data ?? []).map((u) => (
        <form key={u.id} action={updateUser} className="glass-card flex flex-wrap items-center gap-3 p-3 text-sm">
          <input type="hidden" name="id" value={u.id} />
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{u.full_name ?? "(no name)"}</p><p className="truncate text-xs text-muted">{u.email} · {u.phone ?? "no phone"} · joined {formatDate(u.created_at)}</p></div>
          <select name="role" defaultValue={u.role} className="input !min-h-9 !w-auto">{roles.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}</select>
          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="is_active" defaultChecked={u.is_active} className="accent-[#ed1026]" />Active</label>
          <button className="btn-outline !min-h-9">Save</button>
        </form>))}
    </div>
  );
}
