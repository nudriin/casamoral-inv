/**
 * Environment configuration validator for Casa Moral
 */
export function getEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const isConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseAnonKey.includes("placeholder")
  );

  return {
    isConfigured,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey && !serviceRoleKey.includes("placeholder")),
  };
}
