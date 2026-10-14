import { describe, it, expect } from "vitest";
import {
  INITIAL_CAPITAL_PURCHASES,
  INITIAL_PRODUCTS,
  INITIAL_MATERIALS,
  INITIAL_ASSETS,
} from "@/lib/data/initial-data";
import { getCapitalSummary } from "@/lib/services/capital-service";

describe("Sprint 2: Master Data & Reconciliation Test Suite", () => {
  it("reconciles capital purchases to exactly Rp 11.440.748 across 23 items", () => {
    expect(INITIAL_CAPITAL_PURCHASES).toHaveLength(23);

    const totalSum = INITIAL_CAPITAL_PURCHASES.reduce(
      (sum, item) => sum + item.totalCost,
      0
    );
    expect(totalSum).toBe(11440748);
  });

  it("reconciles category breakdown of initial capital accurately", async () => {
    const summary = await getCapitalSummary();
    expect(summary.totalCapital).toBe(11440748);
    expect(summary.totalItems).toBe(23);

    const mesin = summary.breakdown.find((b) => b.category === "MESIN");
    const filamen = summary.breakdown.find((b) => b.category === "FILAMEN");
    const kelistrikan = summary.breakdown.find((b) => b.category === "KELISTRIKAN");
    const kemasan = summary.breakdown.find((b) => b.category === "KEMASAN");
    const alat = summary.breakdown.find((b) => b.category === "ALAT");

    expect(mesin?.totalCost).toBe(9462021); // A1 Mini + Kobra X
    expect(filamen?.totalCost).toBe(1339561); // 10 rolls of filament
    expect(kelistrikan?.totalCost).toBe(442450); // Fittings, switches, bulb
    expect(kemasan?.totalCost).toBe(102217); // Boxes + bubble wrap
    expect(alat?.totalCost).toBe(94499); // Caliper + magnets

    const sumOfBreakdown = summary.breakdown.reduce((sum, b) => sum + b.totalCost, 0);
    expect(sumOfBreakdown).toBe(11440748);
  });

  it("verifies 4 master lamp models with exact HPP matching Excel formulas", () => {
    expect(INITIAL_PRODUCTS).toHaveLength(4);

    const lumi = INITIAL_PRODUCTS.find((p) => p.sku === "CM-LUMI-01");
    const ollie = INITIAL_PRODUCTS.find((p) => p.sku === "CM-OLLIE-01");
    const kumo = INITIAL_PRODUCTS.find((p) => p.sku === "CM-KUMO-01");
    const pomi = INITIAL_PRODUCTS.find((p) => p.sku === "CM-POMI-01");

    expect(lumi).toBeDefined();
    expect(ollie).toBeDefined();
    expect(kumo).toBeDefined();
    expect(pomi).toBeDefined();

    // Verify Lumi
    expect(lumi?.bom.totalFilamentGram).toBe(166.4);
    expect(lumi?.current_hpp).toBeCloseTo(81182.4, 2);
    expect(lumi?.recommended_price).toBeCloseTo(121773.6, 2);

    // Verify Ollie
    expect(ollie?.bom.totalFilamentGram).toBe(203.08);
    expect(ollie?.current_hpp).toBeCloseTo(89705.28, 2);
    expect(ollie?.recommended_price).toBeCloseTo(134557.92, 2);

    // Verify Kumo
    expect(kumo?.bom.totalFilamentGram).toBe(170.13);
    expect(kumo?.current_hpp).toBeCloseTo(82588.08, 2);
    expect(kumo?.recommended_price).toBeCloseTo(123882.12, 2);

    // Verify Pomi
    expect(pomi?.bom.totalFilamentGram).toBe(268.76);
    expect(pomi?.current_hpp).toBeCloseTo(103892.16, 2);
    expect(pomi?.recommended_price).toBeCloseTo(155838.24, 2);
  });

  it("validates BOM component integrity for each model", () => {
    for (const prod of INITIAL_PRODUCTS) {
      const calculatedFilamentCost = (prod.bom.totalFilamentGram / 1000) * 180000;
      expect(prod.bom.filamentCost).toBeCloseTo(calculatedFilamentCost, 2);

      const calculatedSubtotal =
        prod.bom.filamentCost + prod.bom.electricalCost + prod.bom.packagingCost;
      expect(prod.bom.subtotalMaterial).toBeCloseTo(calculatedSubtotal, 2);

      const calculatedHpp = calculatedSubtotal * prod.bom.overheadMultiplier;
      expect(prod.current_hpp).toBeCloseTo(calculatedHpp, 2);
    }
  });

  it("verifies master materials and stock parameters", () => {
    expect(INITIAL_MATERIALS.length).toBeGreaterThanOrEqual(8);

    const filament = INITIAL_MATERIALS.find((m) => m.category === "filament");
    expect(filament).toBeDefined();
    expect(filament?.unit).toBe("gram");
    expect(filament?.cost_per_unit).toBe(180); // Rp 180/g

    const led = INITIAL_MATERIALS.find((m) => m.name.includes("LED"));
    expect(led?.cost_per_unit).toBe(15000);

    const fitting = INITIAL_MATERIALS.find((m) => m.name.includes("Fitting"));
    expect(fitting?.cost_per_unit).toBe(6000);
  });

  it("verifies 3D printer assets status and specifications", () => {
    const bambu = INITIAL_ASSETS.find((a) => a.name.includes("Bambulab A1 Mini"));
    const anycubic = INITIAL_ASSETS.find((a) => a.name.includes("Anycubic Kobra X"));

    expect(bambu).toBeDefined();
    expect(bambu?.purchase_price).toBe(3589221);
    expect(bambu?.power_watts).toBe(60);

    expect(anycubic).toBeDefined();
    expect(anycubic?.purchase_price).toBe(5872800);
    expect(anycubic?.power_watts).toBe(110);
  });
});
