"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, type ActionState } from "@/components/ui/form";
import { requestManagedSale } from "@/app/actions/managed";
import { districts } from "@/config/site";

export function ManagedSaleForm({ defaults }: { defaults: { name: string; phone: string } }) {
  const [state, action] = useActionState(requestManagedSale, {} as ActionState);
  const done = Boolean(state.message);
  return (
    <form action={action} className="glass-card space-y-4 p-5 sm:p-6">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *" name="contact_name"><input id="contact_name" name="contact_name" defaultValue={defaults.name} required className="input" /></Field>
        <Field label="Phone number *" name="contact_phone"><input id="contact_phone" name="contact_phone" type="tel" defaultValue={defaults.phone} required className="input" /></Field>
      </div>
      <Field label="Vehicle details *" name="vehicle_details" hint="Brand, model, variant, year, mileage.">
        <input id="vehicle_details" name="vehicle_details" required placeholder="e.g. Toyota Prado TX 2015, 90,000 km" className="input" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location *" name="location">
          <select id="location" name="location" required defaultValue="" className="input"><option value="" disabled>Select district</option>{districts.map((d) => <option key={d}>{d}</option>)}</select>
        </Field>
        <Field label="Amount you want to receive (PKR) *" name="seller_asking_price" hint="Brokerage is added on top. You'll see it before agreeing.">
          <input id="seller_asking_price" name="seller_asking_price" inputMode="numeric" required placeholder="1000000" className="input" />
        </Field>
      </div>
      <Field label="Preferred contact method" name="preferred_contact">
        <select id="preferred_contact" name="preferred_contact" defaultValue="phone" className="input"><option value="phone">Phone call</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select>
      </Field>
      <Field label="Anything else we should know?" name="description"><textarea id="description" name="description" rows={3} className="input py-2" /></Field>
      <FormMessage state={state} />
      <SubmitButton className="w-full" pendingText="Sending..." >{done ? "Send another request" : "Request Managed Sale"}</SubmitButton>
    </form>
  );
}
