export type UserRole = "user" | "super_admin" | "listing_manager" | "sales_agent" | "photographer";
export type ListingStatus = "draft" | "pending" | "active" | "rejected" | "reserved" | "sold" | "expired";
export type InquiryStatus =
  | "new" | "buyer_contacted" | "seller_contacted" | "viewing_arranged"
  | "negotiation" | "deal_confirmed" | "completed" | "unsuccessful";
export type DealStatus = "requested" | "agreed" | "listed" | "negotiating" | "completed" | "cancelled";
export type BrokerageType = "fixed" | "percentage" | "tiered" | "custom" | "zero";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  district: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

/** Row shape of the public_vehicles view (no seller-private fields). */
export interface PublicVehicle {
  id: string;
  reference: string;
  slug: string;
  brand: string;
  model: string;
  variant: string | null;
  model_year: number;
  registration_year: number | null;
  engine_cc: number | null;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  steering_side: string | null;
  import_origin: string | null;
  mileage_km: number | null;
  condition: string | null;
  engine_condition: string | null;
  suspension_condition: string | null;
  tyre_condition: string | null;
  accident_history: string | null;
  repainted_panels: string | null;
  known_defects: string | null;
  documents_available: string | null;
  registration_status: "registered" | "unregistered" | "unknown";
  customs_status: "customs_paid" | "ncp" | "other" | "unknown";
  district: string;
  town: string | null;
  description: string | null;
  advertised_price: number;
  selling_mode: "standard" | "managed";
  status: ListingStatus;
  is_featured: boolean;
  is_demo: boolean;
  docs_reviewed: boolean;
  gbw_inspected: boolean;
  independently_verified: boolean;
  view_count: number;
  published_at: string | null;
  created_at: string;
}

export interface VehicleImage {
  id: string;
  vehicle_id: string;
  storage_path: string;
  url: string;
  angle: string | null;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
}

export type VehicleWithImage = PublicVehicle & { cover_url: string | null };
