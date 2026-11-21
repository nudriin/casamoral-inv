import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/cron/keepalive/route";

describe("Secure Supabase Keep-Alive Route (/api/cron/keepalive)", () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...origEnv };
  });

  afterEach(() => {
    process.env = origEnv;
  });

  it("rejects production requests when CRON_SECRET is missing (500)", async () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    delete process.env.CRON_SECRET;

    const req = new Request("https://casamoral-inv.vercel.app/api/cron/keepalive");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("CRON_SECRET");
  });

  it("rejects requests with invalid Bearer token when CRON_SECRET is set (401)", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token";

    const req = new Request("https://casamoral-inv.vercel.app/api/cron/keepalive", {
      headers: { authorization: "Bearer wrong-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 503 when Supabase credentials are not configured", async () => {
    process.env.CRON_SECRET = "super-secret-cron-token";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://placeholder-project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "placeholder-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = new Request("https://casamoral-inv.vercel.app/api/cron/keepalive", {
      headers: { authorization: "Bearer super-secret-cron-token" },
    });
    const res = await GET(req);
    expect(res.status).toBe(503);
  });
});
