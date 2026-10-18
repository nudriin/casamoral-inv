import { describe, it, expect } from "vitest";
import {
  calculateElsProductRow,
  calculateAssetsDepreciation,
  calculateElsStudioSummary,
  ElsOverheadItem,
  DEFAULT_ELS_ASSUMPTIONS,
  DEFAULT_ELS_CAPITAL,
  DEFAULT_ELS_DEPRECIATION_ASSETS,
  DEFAULT_ELS_PRODUCTS,
} from "@/lib/financial/els-studio-engine";

describe("ELS Studio Dynamic Configuration & Custom Workshop Setup", () => {
  it("allows setting 0 for staff packing salary and designer salary, eliminating employee overhead", () => {
    // Custom overhead with NO designer and NO staff
    const customOverhead: ElsOverheadItem[] = [
      { id: "ovh-1", name: "Gaji Desainer 3D", amount: 0, isActive: false },
      { id: "ovh-2", name: "Lisensi Desain Komersial", amount: 0, isActive: false },
      { id: "ovh-3", name: "Listrik Non-Produksi", amount: 100000, isActive: true },
      { id: "ovh-4", name: "Internet & WiFi Studio", amount: 250000, isActive: true },
      { id: "ovh-5", name: "Maintenance & Sparepart", amount: 150000, isActive: true },
    ];

    // Custom assumptions with 0 staff packing salary
    const customAssumptions = {
      ...DEFAULT_ELS_ASSUMPTIONS,
      staffPackingSalary: 0, // No packing staff employed
    };

    // 1 custom printer
    const customPrinters = [
      { id: "prt-my1", name: "My Custom Ender", powerWatts: 80, usefulLifeMonths: 24 },
    ];

    // 1 custom filament
    const customFilaments = [
      { id: "fil-my1", brand: "Lokal Econ PLA", type: "PLA", pricePerKg: 130000 },
    ];

    const customAccessories = [
      { id: "acc-paracord", name: "Paracord", price: 3000, unit: "per m" },
      { id: "acc-carabiner", name: "Carabiner", price: 1000, unit: "per pcs" },
      { id: "acc-switch", name: "Switch", price: 1200, unit: "per pcs" },
      { id: "acc-nfc", name: "NFC", price: 1500, unit: "per pcs" },
    ];

    const depMap = calculateAssetsDepreciation(DEFAULT_ELS_DEPRECIATION_ASSETS);

    const testProduct = {
      ...DEFAULT_ELS_PRODUCTS[0],
      printer: "My Custom Ender",
      filamentBrand: "Lokal Econ PLA",
      weightGram: 20,
      printTimeMinutes: 60,
    };

    const rowResult = calculateElsProductRow(
      testProduct,
      customAssumptions,
      customFilaments,
      customPrinters,
      customAccessories,
      depMap
    );

    // Packing staff cost per unit should be exactly 0
    expect(rowResult.staffPackingCost).toBe(0);

    // Filament cost: (20 / 1000) * 130000 * 1.05 = 2730
    expect(rowResult.filamentCost).toBe(2730);

    // Summary calculation
    const summary = calculateElsStudioSummary(
      [testProduct],
      customAssumptions,
      customOverhead,
      DEFAULT_ELS_CAPITAL,
      DEFAULT_ELS_DEPRECIATION_ASSETS,
      customFilaments,
      customPrinters,
      customAccessories
    );

    // Overhead should be sum of active items (100k + 250k + 150k = 500k)
    expect(summary.totalOverheadMonthly).toBe(500000);
    expect(summary.totalMonthlyStaffSalary).toBe(0);

    // BEP should calculate dynamically based on 500k overhead
    expect(summary.bepUnitsMonthly).toBeGreaterThan(0);
    expect(summary.bepUnitsMonthly).toBeLessThan(100); // Much lower BEP when overhead is small
  });

  it("handles custom printer deletion and fallback gracefully", () => {
    const singlePrinter = [
      { id: "p-sole", name: "Bambu Lab A1 Only", powerWatts: 110, usefulLifeMonths: 24 },
    ];

    const singleFilament = [
      { id: "f-sole", brand: "Sunlu Meta", type: "PLA", pricePerKg: 175000 },
    ];

    const depMap = new Map<string, { monthly: number; hourly: number }>();
    depMap.set("Bambu Lab A1 Only", { monthly: 300000, hourly: 2000 });

    const p = {
      ...DEFAULT_ELS_PRODUCTS[0],
      printer: "Bambu Lab A1 Only",
      filamentBrand: "Sunlu Meta",
    };

    const res = calculateElsProductRow(
      p,
      DEFAULT_ELS_ASSUMPTIONS,
      singleFilament,
      singlePrinter,
      [],
      depMap
    );

    expect(res.totalHpp).toBeGreaterThan(0);
    expect(res.grossProfit).toBeGreaterThan(0);
  });

  it("calculates dynamic accessories from Section C with custom quantities and prices", () => {
    // Custom accessories matching what user configures in Section C
    const customAccessories = [
      { id: "acc-baut", name: "Baut M3 x 10mm", price: 250, unit: "per pcs" },
      { id: "acc-magnet", name: "Magnet Neodymium 5x2mm", price: 800, unit: "per pcs" },
      { id: "acc-box-custom", name: "Dus Die Cut 10x10", price: 1800, unit: "per pcs" },
    ];

    const depMap = new Map<string, { monthly: number; hourly: number }>();
    depMap.set("A1", { monthly: 395791.67, hourly: 2638.61 });

    const productWithDynamicAcc = {
      ...DEFAULT_ELS_PRODUCTS[0],
      printer: "A1",
      // Needs 4 bolts and 2 magnets
      accessoryQuantities: {
        "acc-baut": 4,
        "acc-magnet": 2,
      },
      packagingPackage: 0,
      customHardwareCost: 500, // plus custom part
    };

    const res = calculateElsProductRow(
      productWithDynamicAcc,
      DEFAULT_ELS_ASSUMPTIONS,
      [{ id: "fil-1", brand: "Bambu Lab (Original)", type: "PLA", pricePerKg: 180000 }],
      [{ id: "prt-1", name: "A1", powerWatts: 110, usefulLifeMonths: 24 }],
      customAccessories,
      depMap
    );

    // Total accessories cost should be:
    // 4 * 250 (1000) + 2 * 800 (1600) + 500 (customHardwareCost) = 3100
    expect(res.totalAccessoriesCost).toBe(3100);
  });
});
