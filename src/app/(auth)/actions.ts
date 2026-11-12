"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { query, queryOne, tx } from "@/lib/db";
import { isDbConfigured } from "@/lib/env";
import { createSession, destroySession, newToken, sha256 } from "@/lib/session";
import { safeNext } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { isEmailConfigured } from "@/lib/env";
import { siteConfig } from "@/config/site";
import type { ActionState } from "@/components/ui/form";

const NOT_CONFIGURED: ActionState = {
  error: "The database is not connected yet. Set DATABASE_URL and redeploy (see README).",
};

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const password = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long");
const phone = z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number").optional().or(z.literal(""));
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input";

// Compared against when the email is unknown, so response time does not reveal which emails exist.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));
const MAX_FAILS = 8; // per email per 15 minutes

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return NOT_CONFIGURED;
  const parsed = z.object({ email, password: z.string().min(1, "Enter your password") }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email: addr, password: pw } = parsed.data;

  try {
    const fails = await queryOne<{ n: number }>(
      "select count(*)::int as n from login_attempts where lower(email) = $1 and created_at > now() - interval '15 minutes'",
      [addr],
    );
    if ((fails?.n ?? 0) >= MAX_FAILS) return { error: "Too many failed attempts. Please wait 15 minutes and try again." };

    const user = await queryOne<{ id: string; password_hash: string; is_active: boolean }>(
      "select id, password_hash, is_active from profiles where lower(email) = $1",
      [addr],
    );
    const ok = await bcrypt.compare(pw, user?.password_hash ?? getDummyHash());
    if (!user || !ok || !user.is_active) {
      await query("insert into login_attempts (email) values ($1)", [addr]);
      return { error: "Incorrect email or password." };
    }
    await query("delete from login_attempts where lower(email) = $1", [addr]);
    await createSession(user.id);
  } catch (e) {
    console.error("[login]", (e as Error).message);
    return { error: "Something went wrong. Please try again." };
  }

  const isAdminLogin = formData.get("area") === "admin";
  redirect(safeNext(formData.get("next") as string, isAdminLogin ? "/admin" : "/dashboard"));
}

export async function register(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return NOT_CONFIGURED;
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Enter your full name").max(100),
      email, phone, password, confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;

  try {
    const hash = await bcrypt.hash(v.password, 12);
    const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
    const id = await tx(async (c) => {
      const exists = await c.query("select 1 from profiles where lower(email) = $1", [v.email]);
      if (exists.rowCount) return null;
      // The very first Super Admin: the account registered with ADMIN_EMAIL while no Super Admin exists yet.
      let role = "user";
      if (adminEmail && v.email === adminEmail) {
        const has = await c.query("select 1 from profiles where role = 'super_admin' limit 1");
        if (!has.rowCount) role = "super_admin";
      }
      const r = await c.query(
        "insert into profiles (email, password_hash, full_name, phone, role) values ($1,$2,$3,$4,$5) returning id",
        [v.email, hash, v.full_name, v.phone || null, role],
      );
      return r.rows[0].id as string;
    });
    if (!id) return { error: "An account with this email already exists. Try signing in." };
    await createSession(id);
  } catch (e) {
    console.error("[register]", (e as Error).message);
    return { error: "Could not create your account. Please try again." };
  }
  redirect("/dashboard");
}

export async function forgotPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return NOT_CONFIGURED;
  const parsed = z.object({ email }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: firstError(parsed.error) };

  if (!isEmailConfigured) {
    return {
      error:
        "Password reset emails are not enabled on this site yet. Please contact GB Wheels and an administrator will send you a reset link.",
    };
  }
  try {
    const user = await queryOne<{ id: string }>("select id from profiles where lower(email) = $1 and is_active", [parsed.data.email]);
    if (user) {
      const token = newToken();
      await query("insert into password_resets (user_id, token_hash, expires_at) values ($1,$2, now() + interval '1 hour')", [user.id, sha256(token)]);
      await sendEmail(
        parsed.data.email,
        "Reset your GB Wheels password",
        `Use this link to choose a new password (valid for 1 hour):\n\n${siteConfig.url}/reset-password?token=${token}\n\nIf you didn't ask for this, ignore this email.`,
      );
    }
  } catch (e) {
    console.error("[forgot]", (e as Error).message);
  }
  // Same answer whether or not the account exists (avoids account enumeration).
  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!isDbConfigured) return NOT_CONFIGURED;
  const parsed = z
    .object({ token: z.string().min(20).max(200), password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, { message: "Passwords do not match", path: ["confirm"] })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  let userId: string | null = null;
  try {
    const hash = await bcrypt.hash(parsed.data.password, 12);
    userId = await tx(async (c) => {
      const r = await c.query(
        "update password_resets set used_at = now() where token_hash = $1 and used_at is null and expires_at > now() returning user_id",
        [sha256(parsed.data.token)],
      );
      if (!r.rowCount) return null;
      const uid = r.rows[0].user_id as string;
      await c.query("update profiles set password_hash = $1 where id = $2", [hash, uid]);
      await c.query("delete from sessions where user_id = $1", [uid]); // sign out everywhere
      return uid;
    });
    if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };
    await createSession(userId);
  } catch (e) {
    console.error("[reset]", (e as Error).message);
    return { error: "Could not reset your password. Please try again." };
  }
  redirect("/dashboard");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
