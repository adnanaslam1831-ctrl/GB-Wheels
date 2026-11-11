/**
 * Central site configuration.
 * All values marked PLACEHOLDER must be replaced with real business details
 * (or set through environment variables) before launch. Nothing here is real.
 */
export const siteConfig = {
  name: "GB Wheels",
  tagline: "Aapki gaari, hamari zimmedari!",
  altTagline: "Gaari ki talaash, GB Wheels ke paas!",
  description:
    "GB Wheels is the dedicated car marketplace for Gilgit-Baltistan. Buy and sell cars with confidence.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "PKR",
  locale: "en",

  // PLACEHOLDER contact details: replace via env vars or edit here.
  contact: {
    phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+92 000 0000000",
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "920000000000", // digits only, country code first
    email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL ?? "hello@example.com",
    address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "Gilgit-Baltistan, Pakistan (address to be added)",
    social: {
      facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
      instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
      youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
      tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "",
    },
  },
} as const;

/** True once real contact details replace the placeholders. Buttons that depend on them stay disabled until then. */
export const contactReady = {
  phone: !siteConfig.contact.phone.includes("000 0000000"),
  whatsapp: siteConfig.contact.whatsapp !== "920000000000" && siteConfig.contact.whatsapp.length > 8,
  email: siteConfig.contact.email !== "hello@example.com",
};

export const districts = [
  "Gilgit",
  "Skardu",
  "Ghizer",
  "Hunza",
  "Nagar",
  "Astore",
  "Diamer",
  "Ghanche",
] as const;

export const brands = [
  "Toyota",
  "Honda",
  "Suzuki",
  "Nissan",
  "Daihatsu",
  "Mitsubishi",
  "Hyundai",
  "Kia",
  "Other",
] as const;

export const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric", "CNG", "LPG"] as const;
export const transmissions = ["Automatic", "Manual"] as const;
export const conditions = ["Excellent", "Good", "Fair", "Needs Work"] as const;
export const registrationStatuses = ["Registered", "Unregistered", "Unknown / Not Sure"] as const;
export const customsStatuses = ["Customs Paid", "NCP", "Other", "Unknown / Not Sure"] as const;

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy Cars" },
  { href: "/sell", label: "Sell Your Car" },
  { href: "/managed-sale", label: "Managed Sale" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
] as const;
