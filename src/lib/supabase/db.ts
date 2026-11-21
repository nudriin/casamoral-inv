import { createAdminClient } from "./admin";
import { createServerSupabaseClient } from "./server";
import { getEnvStatus } from "@/lib/env";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

/**
 * Returns a Supabase client for server-side services.
 * Uses the Service Role key when available so PIN-authenticated server actions
 * bypass RLS safely on the server.
 */
export async function getServiceSupabaseClient() {
  const { hasServiceRoleKey } = getEnvStatus();
  if (hasServiceRoleKey) {
    return createAdminClient();
  }
  return await createServerSupabaseClient();
}
