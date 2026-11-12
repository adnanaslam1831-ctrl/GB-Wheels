import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { query, queryOne } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import type { Profile } from "@/types/db";

export const SESSION_COOKIE = "gbw_session";
const SESSION_DAYS = 30;

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

/** Creates a DB-backed session and sets an httpOnly cookie. Only the hash of the token is stored. */
export async function createSession(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await query("insert into sessions (user_id, token_hash, expires_at) values ($1,$2,$3)", [userId, sha256(token), expires]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  // opportunistic cleanup
  await query("delete from sessions where expires_at < now()").catch(() => {});
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && isDbConfigured) await query("delete from sessions where token_hash = $1", [sha256(token)]).catch(() => {});
  jar.delete(SESSION_COOKIE);
}

/** The signed-in user's profile (never includes the password hash), or null. Validated against the DB on every request. */
export const getSessionProfile = cache(async (): Promise<Profile | null> => {
  if (!isDbConfigured) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await queryOne<Profile>(
      `select p.id, p.email, p.full_name, p.phone, p.district, p.role, p.is_active, p.created_at
         from sessions s join profiles p on p.id = s.user_id
        where s.token_hash = $1 and s.expires_at > now() and p.is_active`,
      [sha256(token)],
    );
  } catch (e) {
    console.error("[session] lookup failed:", (e as Error).message);
    return null;
  }
});
