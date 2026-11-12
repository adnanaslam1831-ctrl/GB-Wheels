import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

/** UI hint only (Login vs Account in the header). Grants nothing. */
export async function GET() {
  const p = await getSessionProfile();
  return NextResponse.json(
    { signedIn: !!p, isStaff: !!p && p.role !== "user" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
