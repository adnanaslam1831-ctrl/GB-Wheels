import { brands, conditions, customsStatuses, districts, fuelTypes, registrationStatuses, transmissions } from "@/config/site";
import type { VehicleFilters } from "@/lib/data/vehicles";

const customsValue: Record<string, string> = {
  "Customs Paid": "customs_paid", NCP: "ncp", Other: "other", "Unknown / Not Sure": "unknown",
};
const regValue: Record<string, string> = { Registered: "registered", Unregistered: "unregistered", "Unknown / Not Sure": "unknown" };

function Sel({ id, name, label, value, options }: {
  id: string; name: string; label: string; value?: string; options: ({ v: string; l: string })[];
}) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="input">
        <option value="">Any</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}

/** Plain GET form (works without JavaScript). Rendered once in the sidebar and once in the mobile drawer. */
export function FilterForm({ f, models, idPrefix }: { f: VehicleFilters; models: Record<string, string[]>; idPrefix: string }) {
  const p = (s: string) => `${idPrefix}-${s}`;
  const opt = (arr: readonly string[]) => arr.map((x) => ({ v: x, l: x }));
  return (
    <form action="/buy" method="get" className="space-y-4">
      {f.sort !== "newest" && <input type="hidden" name="sort" value={f.sort} />}
      <div>
        <label htmlFor={p("q")} className="label">Search</label>
        <input id={p("q")} name="q" defaultValue={f.q} placeholder="Brand, model, town or ref" className="input" />
      </div>
      <Sel id={p("brand")} name="brand" label="Brand" value={f.brand} options={opt(brands)} />
      <div>
        <label htmlFor={p("model")} className="label">Model</label>
        <select id={p("model")} name="model" defaultValue={f.model ?? ""} className="input">
          <option value="">Any</option>
          {Object.entries(models).filter(([, m]) => m.length).map(([b, list]) => (
            <optgroup key={b} label={b}>{list.map((m) => <option key={m} value={m}>{m}</option>)}</optgroup>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={p("variant")} className="label">Variant</label>
        <input id={p("variant")} name="variant" defaultValue={f.variant} placeholder="e.g. GLI, Grande" className="input" />
      </div>
      <fieldset>
        <legend className="label">Price (PKR)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Minimum price" name="minPrice" inputMode="numeric" defaultValue={f.minPrice} placeholder="Min" className="input" />
          <input aria-label="Maximum price" name="maxPrice" inputMode="numeric" defaultValue={f.maxPrice} placeholder="Max" className="input" />
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Model year</legend>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="From year" name="minYear" inputMode="numeric" defaultValue={f.minYear} placeholder="From" className="input" />
          <input aria-label="To year" name="maxYear" inputMode="numeric" defaultValue={f.maxYear} placeholder="To" className="input" />
        </div>
      </fieldset>
      <Sel id={p("district")} name="district" label="District" value={f.district} options={opt(districts)} />
      <Sel id={p("fuel")} name="fuel" label="Fuel type" value={f.fuel} options={opt(fuelTypes)} />
      <Sel id={p("trans")} name="transmission" label="Transmission" value={f.transmission} options={opt(transmissions)} />
      <fieldset>
        <legend className="label">Engine capacity (cc)</legend>
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Minimum cc" name="minCc" inputMode="numeric" defaultValue={f.minCc} placeholder="Min" className="input" />
          <input aria-label="Maximum cc" name="maxCc" inputMode="numeric" defaultValue={f.maxCc} placeholder="Max" className="input" />
        </div>
      </fieldset>
      <div>
        <label htmlFor={p("mileage")} className="label">Max mileage (km)</label>
        <input id={p("mileage")} name="maxMileage" inputMode="numeric" defaultValue={f.maxMileage} placeholder="e.g. 80000" className="input" />
      </div>
      <Sel id={p("cond")} name="condition" label="Condition" value={f.condition} options={opt(conditions)} />
      <Sel id={p("reg")} name="registration" label="Registration status" value={f.registration}
        options={registrationStatuses.map((l) => ({ v: regValue[l], l }))} />
      <Sel id={p("customs")} name="customs" label="Customs status" value={f.customs}
        options={customsStatuses.map((l) => ({ v: customsValue[l], l }))} />
      <div className="flex gap-2 pt-2">
        <button type="submit" className="btn-primary flex-1">Apply Filters</button>
        <a href="/buy" className="btn-outline">Clear</a>
      </div>
    </form>
  );
}
