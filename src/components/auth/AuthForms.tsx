"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, type ActionState } from "@/components/ui/form";
import { forgotPassword, login, register, resetPassword } from "@/app/(auth)/actions";

const initial: ActionState = {};

export function LoginForm({ next, area }: { next?: string; area?: "admin" }) {
  const [state, action] = useActionState(login, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      {area && <input type="hidden" name="area" value={area} />}
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      <Field label="Password" name="password">
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingText="Signing in...">Sign In</SubmitButton>
      {!area && (
        <div className="flex justify-between text-sm">
          <Link href="/forgot-password" className="text-muted hover:text-accent">Forgot password?</Link>
          <Link href="/register" className="text-muted hover:text-accent">Create account</Link>
        </div>
      )}
    </form>
  );
}

export function RegisterForm() {
  const [state, action] = useActionState(register, initial);
  return (
    <form action={action} className="space-y-4">
      <Field label="Full name" name="full_name">
        <input id="full_name" name="full_name" autoComplete="name" required className="input" />
      </Field>
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      <Field label="Phone (optional)" name="phone" hint="Used by GB Wheels staff only. It is never shown publicly.">
        <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+92 3XX XXXXXXX" className="input" />
      </Field>
      <Field label="Password" name="password" hint="At least 8 characters.">
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      <Field label="Confirm password" name="confirm">
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingText="Creating account...">Create Account</SubmitButton>
      <p className="text-center text-sm text-muted">
        Already registered? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(forgotPassword, initial);
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email">
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingText="Sending...">Send Reset Link</SubmitButton>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(resetPassword, initial);
  return (
    <form action={action} className="space-y-4">
      <Field label="New password" name="password" hint="At least 8 characters.">
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      <Field label="Confirm new password" name="confirm">
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingText="Saving...">Update Password</SubmitButton>
    </form>
  );
}
