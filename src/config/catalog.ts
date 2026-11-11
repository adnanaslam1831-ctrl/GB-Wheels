/** Reference catalogue used for form suggestions only. Listings themselves live in the database. */
export const modelCatalog: Record<string, string[]> = {
  Toyota: ["Corolla", "Crown", "Land Cruiser", "Prado", "Hilux", "Aqua", "Yaris", "Vitz", "Passo", "Fortuner", "Revo", "Premio", "Allion", "Harrier", "Rush", "Hiace"],
  Honda: ["Civic", "City", "Vezel", "BR-V", "Fit", "N-One", "Accord", "CR-V"],
  Suzuki: ["Alto", "Cultus", "Swift", "Wagon R", "Mehran", "Bolan", "Jimny", "Every", "Ravi"],
  Nissan: ["Dayz", "Note", "Juke", "Sunny", "Patrol", "X-Trail"],
  Daihatsu: ["Mira", "Cuore", "Move", "Tanto", "Hijet", "Terios", "Charade"],
  Mitsubishi: ["Lancer", "Pajero", "Mirage", "Minica", "Ek Wagon"],
  Hyundai: ["Tucson", "Elantra", "Sonata", "Santro", "Porter"],
  Kia: ["Sportage", "Picanto", "Stonic", "Sorento", "Carnival"],
  Other: [],
};

export const importOrigins = ["Local (Pakistan assembled)", "Japan", "UK", "UAE", "Other / Unknown"] as const;
export const steeringSides = ["Right-hand drive", "Left-hand drive"] as const;
export const photoAngles = [
  "Front view", "Rear view", "Left side", "Right side", "Interior",
  "Dashboard", "Odometer", "Engine bay", "Tyres", "Damaged area", "Other",
] as const;

/**
 * Hero photography. Leave `image` null to show the generic illustration; to use real photos,
 * put licensed images in /public/hero and set e.g. image: "/hero/crown.jpg".
 */
export const heroCars = [
  { key: "crown", name: "Toyota Crown 2022", tone: "Black", image: null as string | null },
  { key: "lc300", name: "Toyota Land Cruiser LC300", tone: "White", image: null as string | null },
  { key: "corolla", name: "Toyota Corolla GLI Grande", tone: "Silver", image: null as string | null },
] as const;

/**
 * Testimonials must come from real customers. Leave empty until you have permission to publish some;
 * the section is hidden automatically while this list is empty.
 */
export const testimonials: { name: string; location: string; quote: string }[] = [];
