import { siHonda, siHyundai, siKia, siMitsubishi, siNissan, siSuzuki, siToyota } from "simple-icons";

const marks: Record<string, { path: string; color: string }> = {
  Toyota: { path: siToyota.path, color: "#f4f5f7" },
  Honda: { path: siHonda.path, color: "#f4f5f7" },
  Suzuki: { path: siSuzuki.path, color: "#ed1026" },
  Nissan: { path: siNissan.path, color: "#f4f5f7" },
  Mitsubishi: { path: siMitsubishi.path, color: "#ed1026" },
  Hyundai: { path: siHyundai.path, color: "#f4f5f7" },
  Kia: { path: siKia.path, color: "#f4f5f7" },
};

/** Brand emblem used only to label the make of a car (nominative use). */
export function BrandMark({ brand, className = "size-9" }: { brand: string; className?: string }) {
  if (brand === "Daihatsu") {
    // Simple stylised "D" swoosh (no official mark bundled).
    return (
      <svg viewBox="0 0 48 32" aria-hidden className={className} fill="#ed1026">
        <path d="M3 4h18c11 0 20 5 24 12-4 7-13 12-24 12H3l7-8h11c5 0 9-1 12-4-3-3-7-4-12-4H10z" />
      </svg>
    );
  }
  if (brand === "Other") {
    return (
      <svg viewBox="0 0 48 12" aria-hidden className={className} fill="#9aa0ab">
        <circle cx="8" cy="6" r="3" /><circle cx="24" cy="6" r="3" /><circle cx="40" cy="6" r="3" />
      </svg>
    );
  }
  const m = marks[brand];
  if (!m) return <span className={`grid place-items-center font-display text-xl font-bold ${className}`}>{brand.charAt(0)}</span>;
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill={m.color}>
      <path d={m.path} />
    </svg>
  );
}
