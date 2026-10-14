import { describe, it, expect } from "vitest";
import {
  calculateStandardHpp,
  calculateAdvancedHpp,
  calculateDepreciationPerHour,
} from "@/lib/financial/hpp-calculator";
import {
  convertMarkupToMargin,
  convertMarginToMarkup,
  calculatePriceFromMarkup,
  calculatePriceFromMargin,
  analyzePricing,
} from "@/lib/financial/pricing-calculator";
import { calculateBEP } from "@/lib/financial/bep-calculator";

describe("Sprint 3: Financial Calculation Engine Test Suite", () => {
  describe("1. Standard HPP Mode (Casa Moral Historical Multiplier 1.20x)", () => {
    it("calculates Lumi HPP and selling price matching Excel exactly", () => {
      const result = calculateStandardHpp({
        filamentGram: 166.4,
        filamentPricePerKg: 180000,
        electricalCost: 31700,
        packagingCost: 6000, // Kardus Lumi Rp 4.000 + Bubble Rp 2.000
        overheadMultiplier: 1.2,
      });

      expect(result.filamentCost).toBe(29952);
      expect(result.subtotalMaterial).toBe(67652);
      expect(result.totalHpp).toBe(81182.4);

      const price = calculatePriceFromMarkup(result.totalHpp, 50);
      expect(price).toBe(121773.6);
    });

    it("calculates Ollie HPP and selling price matching Excel exactly", () => {
      const result = calculateStandardHpp({
        filamentGram: 203.08,
        filamentPricePerKg: 180000,
        electricalCost: 31700,
        packagingCost: 6500, // Kardus Ollie Rp 4.500 + Bubble Rp 2.000
        overheadMultiplier: 1.2,
      });

      expect(result.filamentCost).toBe(36554.4);
      expect(result.subtotalMaterial).toBe(74754.4);
      expect(result.totalHpp).toBe(89705.28);

      const price = calculatePriceFromMarkup(result.totalHpp, 50);
      expect(price).toBe(134557.92);
    });

    it("calculates Kumo HPP matching Excel exactly", () => {
      const result = calculateStandardHpp({
        filamentGram: 170.13,
        filamentPricePerKg: 180000,
        electricalCost: 31700,
        packagingCost: 6500,
        overheadMultiplier: 1.2,
      });

      expect(result.filamentCost).toBe(30623.4);
      expect(result.totalHpp).toBe(82588.08);

      const price = calculatePriceFromMarkup(result.totalHpp, 50);
      expect(price).toBe(123882.12);
    });

    it("calculates Pomi HPP matching Excel exactly", () => {
      const result = calculateStandardHpp({
        filamentGram: 268.76,
        filamentPricePerKg: 180000,
        electricalCost: 31700,
        packagingCost: 6500,
        overheadMultiplier: 1.2,
      });

      expect(result.filamentCost).toBe(48376.8);
      expect(result.totalHpp).toBe(103892.16);

      const price = calculatePriceFromMarkup(result.totalHpp, 50);
      expect(price).toBe(155838.24);
    });
  });

  describe("2. Advanced HPP Mode (Template ELS Studio Engineering Slicing)", () => {
    it("calculates hourly machine depreciation correctly", () => {
      // A1 Mini: (7.999.000 - 500.000) / 24 bln / 150 jam/bln = 2083.0556 Rp/jam
      const a1MiniDep = calculateDepreciationPerHour(7999000, 500000, 24, 150);
      expect(a1MiniDep).toBeCloseTo(2083.0556, 2);

      // A1: (9.999.000 - 500.000) / 24 bln / 150 jam/bln = 2638.6111 Rp/jam
      const a1Dep = calculateDepreciationPerHour(9999000, 500000, 24, 150);
      expect(a1Dep).toBeCloseTo(2638.6111, 2);
    });

    it("calculates Template Product Row 5 (BTS ARIRANG 4 CAP) precisely", () => {
      const depA1 = calculateDepreciationPerHour(9999000, 500000, 24, 150);

      const result = calculateAdvancedHpp({
        filamentGram: 16,
        filamentPricePerKg: 180000,
        purgeWasteFactor: 0.05,
        printTimeMinutes: 45,
        printerPowerWatts: 110,
        electricityRatePerKwh: 1666,
        depreciationPerHour: depA1,
        rejectRate: 0.08,
        accessoriesCost: 4000 + 1500 + 4 * 1200, // Paracord + Carabiner + 4 Switch
        packagingCost: 2800, // Kardus 1500 + opp 500 + bubble 500 + stiker 300
        staffPackingAllocation: 1000000 / 450, // 2222.22
      });

      expect(result.filamentCost).toBeCloseTo(3024, 1);
      expect(result.electricityCost).toBeCloseTo(137.45, 1);
      expect(result.depreciationCost).toBeCloseTo(1978.96, 1);
      expect(result.failureCost).toBeCloseTo(446.99, 1);
      expect(result.accessoriesCost).toBe(10300);
      expect(result.totalHpp).toBeCloseTo(20909.62, 1);
    });
  });

  describe("3. Markup vs Margin Two-Way Conversions", () => {
    it("converts Markup to Margin correctly", () => {
      // 50% Markup = 33.3333% Margin
      expect(convertMarkupToMargin(50)).toBeCloseTo(33.3333, 2);
      // 100% Markup = 50% Margin
      expect(convertMarkupToMargin(100)).toBeCloseTo(50, 2);
      // 25% Markup = 20% Margin
      expect(convertMarkupToMargin(25)).toBeCloseTo(20, 2);
    });

    it("converts Margin to Markup correctly", () => {
      // 50% Margin = 100% Markup
      expect(convertMarginToMarkup(50)).toBeCloseTo(100, 2);
      // 33.3333% Margin = 50% Markup
      expect(convertMarginToMarkup(33.3333)).toBeCloseTo(50, 1);
      // 20% Margin = 25% Markup
      expect(convertMarginToMarkup(20)).toBeCloseTo(25, 2);
    });

    it("generates correct price from target Markup and target Margin", () => {
      const hpp = 10000;
      // Markup 50% => Rp 15.000
      expect(calculatePriceFromMarkup(hpp, 50)).toBe(15000);
      // Margin 50% => Rp 20.000
      expect(calculatePriceFromMargin(hpp, 50)).toBe(20000);
    });
  });

  describe("4. Marketplace Deductions & Pricing Analysis", () => {
    it("models Shopee 8% admin fee and 4% shipping xtra correctly", () => {
      const analysis = analyzePricing(130000, 89705.28, {
        shopeeAdminRate: 0.08,
        freeShippingXtraRate: 0.04,
        freeShippingMaxCap: 10000,
        includeShippingXtra: true,
      });

      // Price: 130.000
      // Shopee Admin (8%): 10.400
      // Gratis Ongkir Xtra (4%): 5.200 (under 10.000 cap)
      // Total Platform Fees: 15.600
      expect(analysis.shopeeAdminFee).toBe(10400);
      expect(analysis.shippingXtraFee).toBe(5200);
      expect(analysis.totalMarketplaceFees).toBe(15600);
      expect(analysis.netRealizedPrice).toBe(114400);

      // Net Gross Profit: 130.000 - 89.705,28 - 15.600 = 24.694,72
      expect(analysis.netGrossProfit).toBeCloseTo(24694.72, 2);
      expect(analysis.netMarginPercent).toBeCloseTo(18.99, 1);
    });

    it("caps Gratis Ongkir Xtra at maximum Rp 10.000 for high value orders", () => {
      const analysis = analyzePricing(300000, 150000, {
        shopeeAdminRate: 0.08,
        freeShippingXtraRate: 0.04,
        freeShippingMaxCap: 10000,
        includeShippingXtra: true,
      });

      // 4% of 300.000 is 12.000, but capped at 10.000
      expect(analysis.shippingXtraFee).toBe(10000);
      expect(analysis.shopeeAdminFee).toBe(24000);
      expect(analysis.totalMarketplaceFees).toBe(34000);
    });
  });

  describe("5. Break-Even Point (BEP) & Payback Period", () => {
    it("reconciles Template ELS Studio BEP calculations precisely", () => {
      const result = calculateBEP({
        monthlyFixedOverhead: 2563000,
        averageSellingPrice: 33785.71429,
        averageUnitHpp: 14378.4896,
        initialCapital: 35617000,
        estimatedMonthlyUnits: 450,
      });

      // Unit Contribution Margin = 33.785,71 - 14.378,49 = Rp 19.407,22 (before platform fee)
      // BEP Units = CEILING(2.563.000 / CM)
      expect(result.bepUnitsPerMonth).toBeGreaterThan(0);
      expect(result.isViable).toBe(true);
      expect(result.paybackPeriodMonths).toBeDefined();
    });

    it("calculates Casa Moral BEP based on Ollie average metrics", () => {
      // Misal Overhead bulanan Rp 2.000.000, Ollie Price 130.000, HPP 89.705,28
      // Margin Kontribusi = 130.000 - 89.705,28 = Rp 40.294,72
      // BEP Unit = CEILING(2.000.000 / 40.294,72) = 50 unit/bln
      const result = calculateBEP({
        monthlyFixedOverhead: 2000000,
        averageSellingPrice: 130000,
        averageUnitHpp: 89705.28,
        initialCapital: 11440748,
        estimatedMonthlyUnits: 60,
      });

      expect(result.unitContributionMargin).toBeCloseTo(40294.72, 2);
      expect(result.bepUnitsPerMonth).toBe(50);
      expect(result.bepUnitsPerDay).toBeCloseTo(1.67, 1);
      expect(result.bepRevenuePerMonth).toBe(50 * 130000); // Rp 6.500.000
      expect(result.isViable).toBe(true);

      // Estimated Monthly Net Profit: (60 * 40.294,72) - 2.000.000 = Rp 417.683,20
      // Payback Period: 11.440.748 / 417.683,20 = ~27.39 bulan
      expect(result.estimatedNetProfit).toBeCloseTo(417683.2, 1);
      expect(result.paybackPeriodMonths).toBeCloseTo(27.39, 1);
    });

    it("handles zero or negative contribution margin safely without crashing", () => {
      const result = calculateBEP({
        monthlyFixedOverhead: 2000000,
        averageSellingPrice: 80000,
        averageUnitHpp: 90000, // HPP > Selling Price
        initialCapital: 10000000,
        estimatedMonthlyUnits: 20,
      });

      expect(result.isViable).toBe(false);
      expect(result.bepUnitsPerMonth).toBe(0);
      expect(result.paybackPeriodMonths).toBeNull();
      expect(result.statusMessage).toContain("negatif");
    });
  });
});
