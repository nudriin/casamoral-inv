import { describe, it, expect } from "vitest";
import {
  calculateElsProductRow,
  calculateAssetsDepreciation,
  calculateElsStudioSummary,
  DEFAULT_ELS_ASSUMPTIONS,
  DEFAULT_ELS_FILAMENTS,
  DEFAULT_ELS_PRINTERS,
  DEFAULT_ELS_ACCESSORIES,
  DEFAULT_ELS_DEPRECIATION_ASSETS,
  DEFAULT_ELS_PRODUCTS,
  DEFAULT_ELS_OVERHEAD,
  DEFAULT_ELS_CAPITAL,
} from "@/lib/financial/els-studio-engine";

describe("Template ELS STUDIO — Comprehensive HPP & Financial Engine Tests", () => {
  it("calculates Sheet 3 Machine Depreciation hourly and monthly rates matching Excel exactly", () => {
    const depMap = calculateAssetsDepreciation(DEFAULT_ELS_DEPRECIATION_ASSETS);

    // A1 mini: (7.999.000 - 500.000) / 24 = 312.458,33 / 150 = 2083.055556
    const a1mini = depMap.get("A1 mini");
    expect(a1mini).toBeDefined();
    expect(a1mini?.monthly).toBeCloseTo(312458.33, 1);
    expect(a1mini?.hourly).toBeCloseTo(2083.06, 1);

    // A1: (9.999.000 - 500.000) / 24 = 395.791,67 / 150 = 2638.611111
    const a1 = depMap.get("A1");
    expect(a1).toBeDefined();
    expect(a1?.monthly).toBeCloseTo(395791.67, 1);
    expect(a1?.hourly).toBeCloseTo(2638.61, 1);

    // P1S: (13.999.000 - 800.000) / 30 = 439.966,67 / 150 = 2933.111111
    const p1s = depMap.get("P1S");
    expect(p1s).toBeDefined();
    expect(p1s?.monthly).toBeCloseTo(439966.67, 1);
    expect(p1s?.hourly).toBeCloseTo(2933.11, 1);

    // Total monthly depreciation
    let totalDep = 0;
    for (const v of depMap.values()) {
      totalDep += v.monthly;
    }
    expect(totalDep).toBeCloseTo(1363494.44, 1);
  });

  it("calculates Sheet 4 Row 5 (BTS ARIRANG 4 CAP) exactly matching Excel numbers", () => {
    const depMap = calculateAssetsDepreciation(DEFAULT_ELS_DEPRECIATION_ASSETS);
    const product = DEFAULT_ELS_PRODUCTS[0]; // BTS ARIRANG 4 CAP

    const res = calculateElsProductRow(
      product,
      DEFAULT_ELS_ASSUMPTIONS,
      DEFAULT_ELS_FILAMENTS,
      DEFAULT_ELS_PRINTERS,
      DEFAULT_ELS_ACCESSORIES,
      depMap
    );

    // Filament cost: (16g / 1000) * 180.000 * 1.05 = 3024
    expect(res.filamentCost).toBe(3024);

    // Electricity cost: (45 / 60) * (110 / 1000) * 1666 = 137.445
    expect(res.electricityCost).toBeCloseTo(137.45, 1);

    // Machine Depreciation: (45 / 60) * 2638.6111 = 1978.9583
    expect(res.depreciationCost).toBeCloseTo(1978.96, 1);

    // Hidden Cost / Print Failure: (3024 + 137.445 + 1978.9583) * (0.08 / 0.92) = 446.99
    expect(res.failureCost).toBeCloseTo(446.99, 1);

    // Accessories: Paracord (4000) + Carabiner (1500) + 4 Switch (4800) = 10300
    expect(res.paracordCost).toBe(4000);
    expect(res.carabinerCost).toBe(1500);
    expect(res.switchCost).toBe(4800);

    // Packaging: 1 * 4300 = 4300
    expect(res.packagingCost).toBe(4300);

    // Staff packing: 1.000.000 / 450 = 2222.22
    expect(res.staffPackingCost).toBeCloseTo(2222.22, 1);

    // Total HPP: 22409.62
    expect(res.totalHpp).toBeCloseTo(22409.62, 1);

    // Shopee fees
    expect(res.adminShopeeCost).toBe(3920); // 49000 * 8%
    expect(res.freeShippingCost).toBe(1960); // 49000 * 4%

    // Gross Profit: 49000 - 22409.62 - 3920 - 1960 = 20710.38
    expect(res.grossProfit).toBeCloseTo(20710.38, 1);

    // Margin %: 20710.38 / 49000 = 42.27%
    expect(res.grossMarginPercent).toBeCloseTo(42.27, 1);

    // Markup %: (49000 - 22409.62) / 22409.62 = 118.66%
    expect(res.markupPercent).toBeCloseTo(118.66, 1);
  });

  it("calculates Sheet 4 Row 6 (ARIRANG VINYL NFC) with NFC and without switch", () => {
    const depMap = calculateAssetsDepreciation(DEFAULT_ELS_DEPRECIATION_ASSETS);
    const product = DEFAULT_ELS_PRODUCTS[1]; // ARIRANG VINYL NFC

    const res = calculateElsProductRow(
      product,
      DEFAULT_ELS_ASSUMPTIONS,
      DEFAULT_ELS_FILAMENTS,
      DEFAULT_ELS_PRINTERS,
      DEFAULT_ELS_ACCESSORIES,
      depMap
    );

    // Filament cost: (12g / 1000) * 180000 * 1.05 = 2268
    expect(res.filamentCost).toBe(2268);

    // NFC cost: 1 * 1500 = 1500
    expect(res.nfcCost).toBe(1500);
    expect(res.switchCost).toBe(0);

    // Shopee admin: 22000 * 8% = 1760
    expect(res.adminShopeeCost).toBe(1760);
    // Free shipping xtra: 22000 * 4% = 880
    expect(res.freeShippingCost).toBe(880);
  });

  it("calculates Sheet 5 BEP and Payback Period correctly", () => {
    const summary = calculateElsStudioSummary(
      DEFAULT_ELS_PRODUCTS,
      DEFAULT_ELS_ASSUMPTIONS,
      DEFAULT_ELS_OVERHEAD,
      DEFAULT_ELS_CAPITAL,
      DEFAULT_ELS_DEPRECIATION_ASSETS,
      DEFAULT_ELS_FILAMENTS,
      DEFAULT_ELS_PRINTERS,
      DEFAULT_ELS_ACCESSORIES
    );

    // Total initial capital: 31.997.000 + 2.000.000 + 1.000.000 + 120.000 + 500.000 = 35.617.000
    expect(summary.totalInitialCapital).toBe(35617000);

    // Total monthly overhead: 2.563.000
    expect(summary.totalOverheadMonthly).toBe(2563000);

    // BEP units monthly should be around 180-190 units
    expect(summary.bepUnitsMonthly).toBeGreaterThan(150);
    expect(summary.bepUnitsMonthly).toBeLessThan(250);

    // Payback period should be around 8 - 12 months
    expect(summary.paybackPeriodMonths).toBeGreaterThan(5);
    expect(summary.paybackPeriodMonths).toBeLessThan(15);
  });
});
