export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True only when real (non-placeholder) credentials are present. */
export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") &&
  !supabaseUrl.includes("YOUR-PROJECT") &&
  supabaseAnonKey.length > 20 &&
  !supabaseAnonKey.startsWith("YOUR_");
