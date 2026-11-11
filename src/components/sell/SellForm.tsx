"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, Check, ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { attachImages, deleteImage, saveVehicle } from "@/app/actions/vehicles";
import { brands, conditions, customsStatuses, districts, fuelTypes, transmissions } from "@/config/site";
import { importOrigins, modelCatalog, photoAngles, steeringSides } from "@/config/catalog";
import {
  IMAGE_TYPES, MAX_IMAGES, MAX_IMAGE_BYTES, emptyForm, toPayload, vehicleSchema, type VehicleFormValues,
} from "@/lib/validation/vehicle";
import { cn, formatPKR } from "@/lib/utils";
import type { VehicleImage } from "@/types/db";

type PendingFile = { id: string; file: File; preview: string; angle: string; state: "ready" | "uploading" | "failed"; error?: string };

const STEPS = ["Vehicle", "Condition", "Photos", "Price & Location", "Selling"] as const;
const regOptions = [["registered", "Registered"], ["unregistered", "Unregistered"], ["unknown", "Unknown / Not Sure"]] as const;
const customsOptions = customsStatuses.map((l) => [({ "Customs Paid": "customs_paid", NCP: "ncp", Other: "other", "Unknown / Not Sure": "unknown" } as Record<string, string>)[l], l] as const);

function Field({ label, k, children, hint }: { label: string; k: keyof VehicleFormValues; children: React.ReactNode; hint?: string }) {
  return (
    <div><label htmlFor={`f-${k}`} className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>
  );
}

export function SellForm({
  userId, initial, existingImages = [], vehicleId: initialId, defaultPhone = "",
}: {
  userId: string;
  initial?: Partial<VehicleFormValues>;
  existingImages?: VehicleImage[];
  vehicleId?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<VehicleFormValues>({ ...emptyForm, contact_phone: defaultPhone, ...initial });
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState(initialId);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [saved, setSaved] = useState<VehicleImage[]>(existingImages);
  const [busy, setBusy] = useState<null | "draft" | "submit">(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileNotes, setFileNotes] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(initialId);
  const managed = v.selling_mode === "managed";
  const lockedMode = isEdit; // selling mode cannot change after creation

  const set = (k: keyof VehicleFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));
  const totalPhotos = saved.length + files.length;

  function addFiles(list: FileList | null) {
    if (!list) return;
    const notes: string[] = [];
    const next: PendingFile[] = [];
    Array.from(list).forEach((f) => {
      if (!(IMAGE_TYPES as readonly string[]).includes(f.type)) return notes.push(`${f.name}: only JPG, PNG or WebP images are allowed.`);
      if (f.size > MAX_IMAGE_BYTES) return notes.push(`${f.name}: larger than 5 MB.`);
      if (totalPhotos + next.length >= MAX_IMAGES) return notes.push(`Maximum ${MAX_IMAGES} photos per listing.`);
      next.push({ id: crypto.randomUUID(), file: f, preview: URL.createObjectURL(f), angle: photoAngles[Math.min(totalPhotos + next.length, photoAngles.length - 1)], state: "ready" });
    });
    setFileNotes(Array.from(new Set(notes)));
    setFiles((s) => [...s, ...next]);
    if (input.current) input.current.value = "";
  }

  function stepError(n: number): string | null {
    if (n === 0) {
      if (!v.brand) return "Choose a brand.";
      if (!v.model.trim()) return "Enter the model.";
      const y = Number(v.model_year);
      if (!y || y < 1980 || y > new Date().getFullYear() + 1) return "Enter a valid model year.";
    }
    if (n === 3) {
      if (!v.district) return "Choose a district.";
      if (!(Number(v.seller_asking_price.replace(/,/g, "")) > 0)) return "Enter your asking price.";
    }
    if (n === 4 && managed && !/^\+?[0-9\s-]{7,16}$/.test(v.contact_phone)) return "Enter a contact phone for the managed sale.";
    return null;
  }

  function next() {
    const e = stepError(step);
    if (e) return setError(e);
    setError(null);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function persist(submit: boolean) {
    setError(null);
    for (const n of [0, 3, 4]) {
      const e = stepError(n);
      if (e) { setStep(n); return setError(submit ? e : `To save a draft: ${e.toLowerCase()}`); }
    }
    const parsed = vehicleSchema.safeParse(toPayload(v));
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Please check the form.");
    if (submit && !managed && totalPhotos < 1) { setStep(2); return setError("Add at least one photo before submitting."); }

    setBusy(submit ? "submit" : "draft");
    const res = await saveVehicle(parsed.data, submit, vehicleId);
    if (!res.ok) { setBusy(null); return setError(res.error); }
    setVehicleId(res.id);

    const failed = await uploadAll(res.id);
    setBusy(null);
    setProgress(null);
    if (failed > 0) return setError(`${failed} photo${failed > 1 ? "s" : ""} failed to upload. Your details are saved; press the button again to retry.`);
    router.push(`/dashboard/listings?saved=${submit ? "submitted" : "draft"}`);
    router.refresh();
  }

  async function uploadAll(id: string) {
    const supabase = createClient();
    const queue = files.filter((f) => f.state !== "uploading");
    if (!queue.length) return 0;
    if (!supabase) { setError("Storage is not configured."); return queue.length; }
    setProgress({ done: 0, total: queue.length });
    const ok: { f: PendingFile; path: string; url: string }[] = [];
    let done = 0;

    async function worker() {
      for (let f = queue.shift(); f; f = queue.shift()) {
        setFiles((s) => s.map((x) => (x.id === f!.id ? { ...x, state: "uploading", error: undefined } : x)));
        const ext = f.file.type === "image/png" ? "png" : f.file.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase!.storage.from("vehicle-images").upload(path, f.file, { contentType: f.file.type, cacheControl: "31536000" });
        done++;
        setProgress({ done, total: done + queue.length });
        if (error) setFiles((s) => s.map((x) => (x.id === f!.id ? { ...x, state: "failed", error: error.message } : x)));
        else ok.push({ f, path, url: supabase!.storage.from("vehicle-images").getPublicUrl(path).data.publicUrl });
      }
    }
    await Promise.all([worker(), worker(), worker()]);

    if (ok.length) {
      const res = await attachImages(id, ok.map((o) => ({ path: o.path, url: o.url, angle: o.f.angle })));
      if (!res.ok) { setError(res.error); return files.length; }
      ok.forEach((o) => URL.revokeObjectURL(o.f.preview));
      setFiles((s) => s.filter((x) => !ok.some((o) => o.f.id === x.id)));
    }
    return files.length - ok.length;
  }

  async function removeSaved(img: VehicleImage) {
    const res = await deleteImage(img.id);
    if (res.ok) setSaved((s) => s.filter((x) => x.id !== img.id));
    else setError(res.error);
  }

  const text = (k: keyof VehicleFormValues, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`f-${k}`} value={v[k]} onChange={set(k)} className="input" {...extra} />
  );
  const select = (k: keyof VehicleFormValues, opts: readonly (string | readonly [string, string])[], blank = "Select") => (
    <select id={`f-${k}`} value={v[k]} onChange={set(k)} className="input">
      <option value="">{blank}</option>
      {opts.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o[0]} value={o[0]}>{o[1]}</option>))}
    </select>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-6 flex items-center gap-1" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1">
            <button type="button" onClick={() => i <= step && setStep(i)} disabled={i > step}
              className={cn("grid size-8 place-items-center rounded-full border text-sm font-semibold transition",
                i < step ? "border-accent bg-accent text-white" : i === step ? "border-accent text-accent" : "border-border text-muted")}
              aria-current={i === step ? "step" : undefined}>
              {i < step ? <Check className="size-4" /> : i + 1}
            </button>
            <span className={cn("hidden text-[11px] sm:block", i === step ? "text-white" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="mb-4 text-center text-sm text-muted sm:hidden">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <div className="glass-card p-4 sm:p-6">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Brand *" k="brand">{select("brand", brands)}</Field>
            <Field label="Model *" k="model">
              {text("model", { list: "model-list", placeholder: "e.g. Corolla", autoComplete: "off" })}
              <datalist id="model-list">{(modelCatalog[v.brand] ?? []).map((m) => <option key={m} value={m} />)}</datalist>
            </Field>
            <Field label="Variant" k="variant">{text("variant", { placeholder: "e.g. GLI, Grande, X" })}</Field>
            <Field label="Model year *" k="model_year">{text("model_year", { inputMode: "numeric", placeholder: "2022" })}</Field>
            <Field label="Registration year" k="registration_year">{text("registration_year", { inputMode: "numeric" })}</Field>
            <Field label="Engine capacity (cc)" k="engine_cc">{text("engine_cc", { inputMode: "numeric", placeholder: "1800" })}</Field>
            <Field label="Colour" k="color">{text("color")}</Field>
            <Field label="Fuel type" k="fuel_type">{select("fuel_type", fuelTypes)}</Field>
            <Field label="Transmission" k="transmission">{select("transmission", transmissions)}</Field>
            <Field label="Steering side" k="steering_side">{select("steering_side", steeringSides)}</Field>
            <Field label="Import origin" k="import_origin">{select("import_origin", importOrigins)}</Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <p className="text-sm text-muted sm:col-span-2">Skip anything you don&apos;t know. Choose &ldquo;Unknown / Not Sure&rdquo; where offered; you are never forced to guess.</p>
            <Field label="Mileage (km)" k="mileage_km">{text("mileage_km", { inputMode: "numeric" })}</Field>
            <Field label="Overall condition" k="condition">{select("condition", conditions)}</Field>
            <Field label="Engine condition" k="engine_condition">{text("engine_condition", { placeholder: "e.g. Runs smoothly, no leaks" })}</Field>
            <Field label="Suspension condition" k="suspension_condition">{text("suspension_condition")}</Field>
            <Field label="Tyre condition" k="tyre_condition">{text("tyre_condition", { placeholder: "e.g. 70% tread left" })}</Field>
            <Field label="Accident history" k="accident_history">{text("accident_history", { placeholder: "None / describe" })}</Field>
            <Field label="Repainted panels" k="repainted_panels">{text("repainted_panels", { placeholder: "None / which panels" })}</Field>
            <Field label="Documents available" k="documents_available">{text("documents_available", { placeholder: "e.g. Registration book, invoice" })}</Field>
            <Field label="Registration status" k="registration_status">{select("registration_status", regOptions, "Select")}</Field>
            <Field label="Customs status" k="customs_status">{select("customs_status", customsOptions, "Select")}</Field>
            <div className="sm:col-span-2">
              <Field label="Known defects" k="known_defects">
                <textarea id="f-known_defects" rows={3} value={v.known_defects} onChange={set("known_defects")} className="input py-2" placeholder="Be honest: it builds buyer trust." />
              </Field>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted">
                Add up to {MAX_IMAGES} photos (JPG, PNG or WebP, max 5 MB each). Helpful shots: front, rear, both sides, interior, dashboard, odometer, engine bay, tyres and any damage.
                {managed && " For a managed sale GB Wheels will photograph the car, so photos here are optional."}
              </p>
              <button type="button" onClick={() => input.current?.click()} disabled={totalPhotos >= MAX_IMAGES}
                className="mt-3 flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-sm text-muted transition hover:border-accent hover:text-white disabled:opacity-50">
                <ImagePlus className="size-8 text-accent" /> Tap to choose photos
                <span className="text-xs">{totalPhotos} / {MAX_IMAGES} added</span>
              </button>
              <input ref={input} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden onChange={(e) => addFiles(e.target.files)} />
              {fileNotes.map((n) => <p key={n} className="mt-2 text-xs text-accent">{n}</p>)}
            </div>

            {(saved.length > 0 || files.length > 0) && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {saved.map((img) => (
                  <li key={img.id} className="overflow-hidden rounded-md border border-border">
                    <div className="relative aspect-[4/3]"><Image src={img.url} alt={img.alt_text ?? ""} fill sizes="200px" className="object-cover" /></div>
                    <div className="flex items-center justify-between gap-1 p-2 text-xs"><span className="truncate text-muted">{img.angle ?? "Photo"}</span>
                      <button type="button" onClick={() => removeSaved(img)} aria-label="Delete photo" className="text-muted hover:text-accent"><Trash2 className="size-4" /></button></div>
                  </li>
                ))}
                {files.map((f) => (
                  <li key={f.id} className="overflow-hidden rounded-md border border-border">
                    <div className="relative aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.preview} alt="Preview" className="size-full object-cover" />
                      {f.state === "uploading" && <div className="absolute inset-0 grid place-items-center bg-black/60"><Loader2 className="size-6 animate-spin" /></div>}
                      {f.state === "failed" && <div className="absolute inset-0 grid place-items-center bg-black/70 p-2 text-center text-xs text-red-300">Failed. Save to retry.</div>}
                    </div>
                    <div className="flex items-center gap-1 p-2">
                      <select aria-label="Photo type" value={f.angle} onChange={(e) => setFiles((s) => s.map((x) => (x.id === f.id ? { ...x, angle: e.target.value } : x)))}
                        className="min-w-0 flex-1 rounded border border-border bg-surface-2 px-1 py-1 text-xs">
                        {photoAngles.map((a) => <option key={a}>{a}</option>)}
                      </select>
                      <button type="button" onClick={() => { URL.revokeObjectURL(f.preview); setFiles((s) => s.filter((x) => x.id !== f.id)); }}
                        aria-label="Remove photo" className="text-muted hover:text-accent"><X className="size-4" /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Asking price (PKR) *" k="seller_asking_price" hint={v.seller_asking_price ? formatPKR(Number(v.seller_asking_price.replace(/,/g, "")) || 0) : undefined}>
              {text("seller_asking_price", { inputMode: "numeric", placeholder: "3500000" })}
            </Field>
            <Field label="District *" k="district">{select("district", districts)}</Field>
            <Field label="Town / area" k="town">{text("town")}</Field>
            <div className="sm:col-span-2">
              <Field label="Description" k="description">
                <textarea id="f-description" rows={5} value={v.description} onChange={set("description")} className="input py-2" placeholder="Condition, service history, why you're selling..." />
              </Field>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {([
              ["standard", "Standard Free Listing", "List your car for free. You manage buyer contact through GB Wheels. Your listing goes live after approval at the price you set."],
              ["managed", "Professional Managed Sale by GB Wheels", "GB Wheels photographs, markets and sells for you. A brokerage fee is added to your price: you will see the exact fee and advertised price and must agree before anything goes live."],
            ] as const).map(([val, title, body]) => (
              <label key={val} className={cn("flex cursor-pointer gap-3 rounded-lg border p-4 transition", v.selling_mode === val ? "border-accent bg-accent/5" : "border-border hover:border-muted", lockedMode && v.selling_mode !== val && "opacity-40")}>
                <input type="radio" name="selling_mode" value={val} checked={v.selling_mode === val} disabled={lockedMode}
                  onChange={() => setV((s) => ({ ...s, selling_mode: val }))} className="mt-1 accent-[#ed1026]" />
                <span><span className="block font-semibold">{title}</span><span className="mt-1 block text-sm text-muted">{body}</span></span>
              </label>
            ))}
            {lockedMode && <p className="text-xs text-muted">The selling preference can&apos;t be changed after the listing is created.</p>}
            {managed && (
              <Field label="Contact phone for GB Wheels *" k="contact_phone" hint="Only GB Wheels staff see this.">
                {text("contact_phone", { type: "tel", placeholder: "+92 3XX XXXXXXX" })}
              </Field>
            )}
            <p className="rounded-md border border-border bg-surface-2 p-3 text-xs text-muted">
              After you submit, the listing is <strong className="text-white">Pending Approval</strong>. A GB Wheels team member reviews it before it appears on the marketplace.
            </p>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-md border border-accent/50 bg-accent/10 px-3 py-2.5 text-sm text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{error}</span>
          </div>
        )}
        {progress && (
          <div className="mt-4" aria-live="polite">
            <div className="h-2 overflow-hidden rounded bg-surface-2"><div className="h-full bg-accent transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} /></div>
            <p className="mt-1 text-xs text-muted">Uploading photos: {progress.done} of {progress.total}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0 || !!busy} className="btn-ghost">Back</button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => persist(false)} disabled={!!busy} className="btn-outline">
              {busy === "draft" && <Loader2 className="size-4 animate-spin" />} Save Draft
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} disabled={!!busy} className="btn-primary">Continue</button>
            ) : (
              <button type="button" onClick={() => persist(true)} disabled={!!busy} className="btn-primary">
                {busy === "submit" && <Loader2 className="size-4 animate-spin" />} {isEdit ? "Save & Submit" : "Submit Listing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
