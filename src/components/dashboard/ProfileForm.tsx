"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, type ActionState } from "@/components/ui/form";
import { updateProfile } from "@/app/actions/profile";
import { districts } from "@/config/site";

export function ProfileForm({ profile }: { profile: { full_name: string | null; phone: string | null; district: string | null; email: string | null } }) {
  const [state, action] = useActionState(updateProfile, {} as ActionState);
  return (
    <form action={action} className="glass-card max-w-xl space-y-4 p-5">
      <Field label="Email" name="email" hint="Email changes are not supported here."><input id="email" value={profile.email ?? ""} disabled className="input opacity-60" /></Field>
      <Field label="Full name" name="full_name"><input id="full_name" name="full_name" defaultValue={profile.full_name ?? ""} required className="input" /></Field>
      <Field label="Phone" name="phone" hint="Visible to GB Wheels staff only."><input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} className="input" /></Field>
      <Field label="District" name="district">
        <select id="district" name="district" defaultValue={profile.district ?? ""} className="input"><option value="">Not set</option>{districts.map((d) => <option key={d}>{d}</option>)}</select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton pendingText="Saving...">Save Profile</SubmitButton>
    </form>
  );
}
