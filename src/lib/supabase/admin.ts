import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Admin Supabase client with Service Role Key.
 * Bypasses Row Level Security (RLS) for data migration, system seeders, and administrative background tasks.
 * NEVER import this file into Client Components!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
