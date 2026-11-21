/**
 * Supabase Keep-Alive Automation Script — Casa Moral
 *
 * Aman tanpa hardcoded credentials dan tanpa password admin plaintext:
 * - Memicu aktivitas Supabase Auth (GoTrue Admin API)
 * - Melakukan write heartbeat ke tabel public.business_settings
 * - Melakukan read count ringan pada tabel orders & materials
 *
 * Penggunaan lokal:
 *   node scripts/supabase-keepalive.js
 */

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  for (const envFile of [".env.local", ".env"]) {
    const fullPath = path.resolve(process.cwd(), envFile);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).replace(/(^["']|["']$)/g, "").trim();
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  SUPABASE_URL.includes("placeholder") ||
  SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")
) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
  process.exit(1);
}

async function runKeepalive() {
  const startTime = Date.now();
  const nowIso = new Date().toISOString();
  console.log("Memulai proses Supabase keep-alive Casa Moral...");

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Trigger Supabase Auth (GoTrue) activity via Admin API
  const { error: authError } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });
  const authStatus = authError ? `Warning: ${authError.message}` : "OK";

  // 2. Write heartbeat to public.business_settings
  const { error: upsertError } = await adminClient.from("business_settings").upsert(
    {
      key: "last_supabase_keepalive",
      value: {
        timestamp: nowIso,
        authStatus,
        durationMs: Date.now() - startTime,
        triggeredVia: "github_actions_script",
      },
      description: "Heartbeat otomatis untuk menjaga proyek Supabase tetap aktif",
      updated_at: nowIso,
    },
    { onConflict: "key" }
  );

  const heartbeatStatus = upsertError ? `Skipped (${upsertError.message})` : "OK";

  // 3. Read check ringan pada tabel utama
  const [{ count: ordersCount }, { count: materialsCount }] = await Promise.all([
    adminClient.from("orders").select("*", { count: "exact", head: true }),
    adminClient.from("materials").select("*", { count: "exact", head: true }),
  ]);

  console.log(
    `Keep-alive berhasil (${Date.now() - startTime} ms) | Auth: ${authStatus} | Heartbeat: ${heartbeatStatus} | Orders: ${ordersCount ?? 0}, Materials: ${materialsCount ?? 0}`
  );
}

runKeepalive().catch((err) => {
  console.error("Keep-alive gagal:", err.message || err);
  process.exit(1);
});
