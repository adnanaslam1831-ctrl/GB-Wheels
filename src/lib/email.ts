import "server-only";
import { isEmailConfigured } from "@/lib/env";

/** Sends through Resend's HTTP API when RESEND_API_KEY + EMAIL_FROM are set. Returns false if not configured or failed. */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!isEmailConfigured) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
