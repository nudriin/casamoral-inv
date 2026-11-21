import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Secure Supabase Keep-Alive Endpoint (Vercel Cron)
 * - Enforces Bearer CRON_SECRET in production (or whenever CRON_SECRET is configured)
 * - Triggers Supabase Auth Admin + PostgreSQL Read/Write without storing plaintext passwords
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !cronSecret) {
    return NextResponse.json(
      { success: false, error: "Server misconfiguration: CRON_SECRET is required in production." },
      { status: 500 }
    );
  }

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const envStatus = getEnvStatus();
  if (!envStatus.isConfigured || !envStatus.hasServiceRoleKey) {
    return NextResponse.json(
      { success: false, error: "Supabase credentials are not configured." },
      { status: 503 }
    );
  }

  try {
    const adminClient = createAdminClient();
    const nowIso = new Date().toISOString();

    // 1. Trigger lightweight Supabase Auth (GoTrue) activity via Admin API (no plaintext password)
    const { error: authError } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1,
    });
    const authStatus = authError ? `Warning: ${authError.message}` : "OK";

    // 2. Write heartbeat to PostgreSQL (public.business_settings if migration 002 applied)
    const { error: upsertError } = await adminClient.from("business_settings").upsert(
      {
        key: "last_supabase_keepalive",
        value: {
          timestamp: nowIso,
          authStatus,
          durationMs: Date.now() - startTime,
          triggeredVia: "vercel_cron",
        },
        description: "Heartbeat otomatis untuk menjaga proyek Supabase tetap aktif",
        updated_at: nowIso,
      },
      { onConflict: "key" }
    );

    const heartbeatStatus = upsertError ? `Skipped (${upsertError.message})` : "OK";

    // 3. Lightweight PostgreSQL read checks (HEAD count)
    const [{ count: ordersCount }, { count: materialsCount }] = await Promise.all([
      adminClient.from("orders").select("*", { count: "exact", head: true }),
      adminClient.from("materials").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Supabase keep-alive executed successfully.",
      timestamp: nowIso,
      durationMs: Date.now() - startTime,
      authStatus,
      heartbeatStatus,
      stats: {
        ordersCount: ordersCount ?? 0,
        materialsCount: materialsCount ?? 0,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Keep-alive execution failed.";
    console.error("Keepalive API Error:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
