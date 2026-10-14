import { describe, it, expect } from "vitest";
import { formatRupiah, formatNumber, cn } from "@/lib/utils";
import { getEnvStatus } from "@/lib/env";

describe("Foundation Utilities (Sprint 1)", () => {
  it("formats Indonesian Rupiah correctly without decimals", () => {
    const formatted = formatRupiah(134558);
    // Replace non-breaking spaces for cross-platform matching
    const cleanStr = formatted.replace(/\s/g, " ");
    expect(cleanStr).toContain("Rp");
    expect(cleanStr).toContain("134.558");
  });

  it("formats Indonesian Rupiah with 2 decimals when requested", () => {
    const formatted = formatRupiah(89705.28, true);
    const cleanStr = formatted.replace(/\s/g, " ");
    expect(cleanStr).toContain("Rp");
    expect(cleanStr).toContain("89.705,28");
  });

  it("handles empty or null values gracefully", () => {
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
    expect(formatNumber(null)).toBe("0");
  });

  it("merges Tailwind CSS classes resolving conflicts", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("validates environment status safely", () => {
    const status = getEnvStatus();
    expect(typeof status.isConfigured).toBe("boolean");
    expect(typeof status.hasUrl).toBe("boolean");
  });
});
