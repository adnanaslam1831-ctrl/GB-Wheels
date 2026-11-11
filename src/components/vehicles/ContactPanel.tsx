"use client";

import { useActionState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { Field, FormMessage, SubmitButton, type ActionState } from "@/components/ui/form";
import { createInquiry, reportListing } from "@/app/actions/inquiries";
import { FavoriteButton } from "./FavoriteButton";

const initial: ActionState = {};
const reasons = ["Fake or misleading listing", "Wrong price or details", "Car already sold", "Inappropriate content", "Other"];

export function ContactPanel({
  vehicleId, reference, title, saved, whatsapp, phone,
}: {
  vehicleId: string; reference: string; title: string; saved: boolean;
  whatsapp: string | null; phone: string | null;
}) {
  const [state, action] = useActionState(createInquiry, initial);
  const [rState, rAction] = useActionState(reportListing, initial);
  const waText = encodeURIComponent(`Hello GB Wheels, I'm interested in ${title} (Ref ${reference}).`);

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 sm:p-5">
        <h2 className="font-display text-lg uppercase tracking-wide">Contact GB Wheels</h2>
        <p className="mt-1 text-xs text-muted">Enquiries go through GB Wheels. The seller&apos;s private details are never shown.</p>
        <form action={action} className="mt-4 space-y-3">
          <input type="hidden" name="vehicle_id" value={vehicleId} />
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
          <Field label="Your name" name="buyer_name"><input id="buyer_name" name="buyer_name" required autoComplete="name" className="input" /></Field>
          <Field label="Phone number" name="buyer_phone"><input id="buyer_phone" name="buyer_phone" type="tel" required autoComplete="tel" placeholder="+92 3XX XXXXXXX" className="input" /></Field>
          <Field label="Message (optional)" name="message">
            <textarea id="message" name="message" rows={3} defaultValue={`I'm interested in this car (Ref ${reference}).`} className="input py-2" />
          </Field>
          <FormMessage state={state} />
          <SubmitButton className="w-full" pendingText="Sending...">Send Inquiry</SubmitButton>
        </form>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {whatsapp ? (
            <a href={`https://wa.me/${whatsapp}?text=${waText}`} target="_blank" rel="noopener noreferrer" className="btn-outline"><MessageCircle className="size-4" />WhatsApp</a>
          ) : (
            <button disabled title="Business WhatsApp number not configured yet" className="btn-outline"><MessageCircle className="size-4" />WhatsApp</button>
          )}
          {phone ? (
            <a href={`tel:${phone.replace(/\s/g, "")}`} className="btn-outline"><Phone className="size-4" />Call</a>
          ) : (
            <button disabled title="Business phone not configured yet" className="btn-outline"><Phone className="size-4" />Call</button>
          )}
        </div>
        <div className="mt-2"><FavoriteButton vehicleId={vehicleId} initialSaved={saved} withLabel /></div>
      </div>

      <details className="glass-card p-4 text-sm">
        <summary className="cursor-pointer font-medium text-muted hover:text-white">Report this listing</summary>
        <form action={rAction} className="mt-3 space-y-3">
          <input type="hidden" name="vehicle_id" value={vehicleId} />
          <Field label="Reason" name="reason">
            <select id="reason" name="reason" required className="input" defaultValue="">
              <option value="" disabled>Select a reason</option>
              {reasons.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Details (optional)" name="details"><textarea id="details" name="details" rows={2} className="input py-2" /></Field>
          <FormMessage state={rState} />
          <SubmitButton variant="outline" className="w-full" pendingText="Submitting...">Submit Report</SubmitButton>
        </form>
      </details>
    </div>
  );
}
