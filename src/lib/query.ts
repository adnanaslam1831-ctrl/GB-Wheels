export type SP = Record<string, string | string[] | undefined>;

export function one(v: string | string[] | undefined): string | undefined {
  const s = Array.isArray(v) ? v[0] : v;
  return s && s.trim() ? s.trim() : undefined;
}

export function num(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Build a query string from current params with overrides (undefined/"" removes a key). */
export function buildQuery(params: Record<string, string | undefined>, overrides: Record<string, string | undefined> = {}) {
  const merged = { ...params, ...overrides };
  const qs = new URLSearchParams();
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, v);
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}
