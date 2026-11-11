import { z } from "zod";
import { districts } from "@/config/site";

const opt = (max = 200) => z.string().trim().max(max).nullable();
const optInt = (min: number, max: number) => z.number().int().min(min).max(max).nullable();

export const MAX_IMAGES = 20;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "Choose a brand").max(60),
  model: z.string().trim().min(1, "Enter the model").max(60),
  variant: opt(80),
  model_year: z.number().int().min(1980, "Model year looks too old").max(new Date().getFullYear() + 1, "Model year is in the future"),
  registration_year: optInt(1980, 2100),
  engine_cc: optInt(50, 10000),
  color: opt(40),
  fuel_type: opt(30),
  transmission: opt(30),
  steering_side: opt(30),
  import_origin: opt(60),

  mileage_km: optInt(0, 2000000),
  condition: opt(30),
  engine_condition: opt(200),
  suspension_condition: opt(200),
  tyre_condition: opt(200),
  accident_history: opt(500),
  repainted_panels: opt(500),
  known_defects: opt(1500),
  documents_available: opt(500),
  registration_status: z.enum(["registered", "unregistered", "unknown"]),
  customs_status: z.enum(["customs_paid", "ncp", "other", "unknown"]),

  district: z.enum(districts, { message: "Choose a district" }),
  town: opt(80),
  description: opt(4000),
  seller_asking_price: z.number().int().positive("Enter your asking price").max(10_000_000_000),

  selling_mode: z.enum(["standard", "managed"]),
  contact_phone: z.string().trim().regex(/^\+?[0-9\s-]{7,16}$/, "Enter a valid phone number").nullable(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;

/** Form-state (everything is a string while editing). */
export type VehicleFormValues = {
  [K in keyof VehicleInput]: string;
};

export const emptyForm: VehicleFormValues = {
  brand: "", model: "", variant: "", model_year: "", registration_year: "", engine_cc: "", color: "",
  fuel_type: "", transmission: "", steering_side: "", import_origin: "",
  mileage_km: "", condition: "", engine_condition: "", suspension_condition: "", tyre_condition: "",
  accident_history: "", repainted_panels: "", known_defects: "", documents_available: "",
  registration_status: "unknown", customs_status: "unknown",
  district: "", town: "", description: "", seller_asking_price: "",
  selling_mode: "standard", contact_phone: "",
};

const intKeys = ["model_year", "registration_year", "engine_cc", "mileage_km", "seller_asking_price"] as const;

/** Convert form strings to the typed payload (empty -> null). */
export function toPayload(v: VehicleFormValues): unknown {
  const out: Record<string, unknown> = {};
  (Object.keys(v) as (keyof VehicleFormValues)[]).forEach((k) => {
    const raw = v[k].trim();
    if ((intKeys as readonly string[]).includes(k)) out[k] = raw === "" ? (k === "model_year" || k === "seller_asking_price" ? NaN : null) : Number(raw.replace(/,/g, ""));
    else if (["brand", "model", "registration_status", "customs_status", "district", "selling_mode"].includes(k)) out[k] = raw;
    else out[k] = raw === "" ? null : raw;
  });
  return out;
}
