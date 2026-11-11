import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPKR(amount: number | null | undefined) {
  if (amount == null) return "Price on request";
  return `PKR ${new Intl.NumberFormat("en-PK").format(amount)}`;
}

export function formatMileage(km: number | null | undefined) {
  if (km == null) return "N/A";
  return `${new Intl.NumberFormat("en-PK").format(km)} km`;
}

export const customsLabels: Record<string, string> = {
  customs_paid: "Customs Paid", ncp: "NCP", other: "Other", unknown: "Unknown / Not Sure",
};
export const registrationLabels: Record<string, string> = {
  registered: "Registered", unregistered: "Unregistered", unknown: "Unknown / Not Sure",
};

export function formatDate(iso: string | null | undefined) {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
