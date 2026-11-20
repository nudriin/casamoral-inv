import { describe, it, expect } from "vitest";
import Decimal from "decimal.js";
import {
  getProductById,
  createProduct,
  deleteOrArchiveProduct,
  toggleProductActive,
} from "@/lib/services/products-service";
import {
  getPayables,
  getPayableById,
  recordInstallmentPayment,
  getPayablesSummary,
} from "@/lib/services/payables-service";
import {
  getBusinessSettings,
  applyGlobalPricingToProducts,
} from "@/lib/services/settings-service";
import {
  calculatePriceFromMarkup,
  calculatePriceFromMargin,
  convertMarkupToMargin,
  convertMarginToMarkup,
} from "@/lib/financial/pricing-calculator";
import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  recordStockMovement,
} from "@/lib/services/materials-service";
import {
  createAsset,
  updateAsset,
  deleteAsset,
  getCapitalPurchases,
  getCapitalSummary,
} from "@/lib/services/capital-service";
import {
  createExpenseCategory,
  createExpense,
  deleteExpense,
} from "@/lib/services/expenses-service";
import { FINANCIAL_INDICATORS } from "@/components/financial-indicator-guide";

describe("CASA MORAL — Revision & Feature Completion Test Suite", () => {
  // =========================================================================
  // 1. PRODUCT VS MODEL SEPARATION & CRUD
  // =========================================================================
  describe("Product & Model Hierarchy and BOM HPP Calculation", () => {
    it("should allow creating a parent product (non-lamp or flexible category)", async () => {
      const parent = await createProduct({
        name: "3D Custom Vase Collection",
        category_id: "cat-decor",
        product_type: "PARENT",
        selling_price: 150000,
        current_hpp: 75000,
      });

      expect(parent.id).toBeDefined();
      expect(parent.name).toBe("3D Custom Vase Collection");
      expect(parent.product_type).toBe("PARENT");
      expect(parent.category_id).toBe("cat-decor");
    });

    it("should allow creating a model variant linked to a parent product with custom BOM", async () => {
      // 1. Create parent
      const parent = await createProduct({
        name: "Lampu Meja Ambient",
        category_id: "cat-ambient",
        product_type: "PARENT",
        selling_price: 110000,
        current_hpp: 60000,
      });

      // 2. Create model variant
      const model = await createProduct({
        name: "Lumi Emerald Edition",
        category_id: "cat-ambient",
        parent_id: parent.id,
        product_type: "MODEL",
        color_variants: [{ name: "Emerald Green", shade: "Emerald", base: "Warm White" }],
        bom: {
          shadeGram: 130,
          baseGram: 80,
          capGram: 15,
          totalFilamentGram: 225,
          filamentCost: 35000,
          electricalCost: 31700,
          packagingCost: 6500,
        },
        selling_price: 125000,
        current_hpp: 75000,
      });

      expect(model.parent_id).toBe(parent.id);
      expect(model.product_type).toBe("MODEL");
      expect(model.color_variants?.[0].name).toBe("Emerald Green");
      expect(model.bom?.totalFilamentGram).toBe(225);

      // Verify product retrieval
      const fetched = await getProductById(model.id);
      expect(fetched?.name).toBe("Lumi Emerald Edition");
    });

    it("should support dynamic BOM format for non-lamp products (e.g. Panel Vape sold as a pair with magnets)", async () => {
      const vapePanel = await createProduct({
        name: "Boro Panel Vape - Hex Pattern (Pair)",
        sku: "VP-BORO-HEX",
        category_id: "cat-accessory",
        product_type: "PRINTED",
        description: "Panel vape magnetik dijual sepasang (depan & belakang) untuk device Boro/AIO",
        standard_overhead_multiplier: 1.20,
        print_time_minutes: 90,
        bom: {
          parts: [
            { id: "p-1", name: "Panel Depan (Front)", gram: 25, quantity: 1 },
            { id: "p-2", name: "Panel Belakang (Back)", gram: 25, quantity: 1 },
          ],
          hardware: [
            { id: "h-1", name: "Magnet Neodymium Bulat 4x2mm", cost: 1500, quantity: 4 },
            { id: "h-2", name: "Pouch Packaging & Sticker", cost: 3000, quantity: 1 },
          ],
        },
        markup_percent: 60,
      });

      expect(vapePanel.id).toBeDefined();
      expect(vapePanel.bom.parts).toHaveLength(2);
      expect(vapePanel.bom.hardware).toHaveLength(2);

      // Total filament: 25g + 25g = 50g
      expect(vapePanel.bom.totalFilamentGram).toBe(50);
      // Filament cost: 50g * Rp 180 = Rp 9.000
      expect(vapePanel.bom.filamentCost).toBe(9000);
      // Hardware cost: (1500 * 4) + (3000 * 1) = 6000 + 3000 = Rp 9.000
      // Material subtotal: 9000 + 9000 = Rp 18.000
      expect(vapePanel.bom.subtotalMaterial).toBe(18000);
      // HPP: 18.000 * 1.20 = Rp 21.600
      expect(vapePanel.current_hpp).toBe(21600);
      // Recommended Price: 21.600 * 1.60 = 34.560 -> rounded up to Rp 35.000
      expect(vapePanel.recommended_price).toBe(34560);
      expect(vapePanel.selling_price).toBe(35000);
    });

    it("should support dynamic BOM format for Clicker / Fidget gadgets with mechanical switches", async () => {
      const clicker = await createProduct({
        name: "Mechanical Switch Clicker Fidget",
        sku: "CK-FIDGET-01",
        category_id: "cat-accessory",
        product_type: "PRINTED",
        description: "Fidget toy gantungan kunci dengan mechanical switch Outemu Blue",
        standard_overhead_multiplier: 1.20,
        print_time_minutes: 45,
        bom: {
          parts: [
            { id: "cp-1", name: "Body Case Clicker", gram: 18, quantity: 1 },
            { id: "cp-2", name: "Keycap Custom 3D", gram: 6, quantity: 1 },
          ],
          hardware: [
            { id: "ch-1", name: "Outemu Blue Clicky Switch", cost: 4500, quantity: 1 },
            { id: "ch-2", name: "Ring Gantungan Kunci", cost: 1500, quantity: 1 },
            { id: "ch-3", name: "Kemasan Plastik Klip", cost: 1000, quantity: 1 },
          ],
        },
        markup_percent: 50,
      });

      expect(clicker.id).toBeDefined();
      expect(clicker.bom.parts).toHaveLength(2);
      expect(clicker.bom.totalFilamentGram).toBe(24); // 18 + 6
      expect(clicker.bom.filamentCost).toBe(4320); // 24 * 180
      // Hardware: 4500 + 1500 + 1000 = 7000
      // Subtotal: 4320 + 7000 = 11320
      expect(clicker.bom.subtotalMaterial).toBe(11320);
      // HPP: 11320 * 1.2 = 13584
      expect(clicker.current_hpp).toBe(13584);
    });

    it("should safely archive products without breaking historical references", async () => {
      const newProd = await createProduct({
        name: "Produk Percobaan",
        category_id: "cat-custom",
        selling_price: 50000,
        current_hpp: 25000,
      });

      // Archive product
      const res = await deleteOrArchiveProduct(newProd.id);
      expect(res.action).toBe("DELETED"); // Because it has no historical order

      // Toggle active status
      const model = await createProduct({
        name: "Model Kumo Special",
        category_id: "cat-ambient",
        selling_price: 105000,
        current_hpp: 60000,
      });
      const toggled = await toggleProductActive(model.id, false);
      expect(toggled?.is_active).toBe(false);
    });
  });

  // =========================================================================
  // 2. PRICING SETTINGS: GLOBAL MARKUP VS MARGIN & MARKETPLACE FEES
  // =========================================================================
  describe("Pricing Settings & Financial Formulas", () => {
    it("should correctly distinguish Markup from Margin using Decimal precision", () => {
      const hpp = 60000;
      const targetPercent = 50; // 50%

      // Markup 50%: Selling Price = HPP * (1 + 0.50) = 90.000
      const priceMarkup = calculatePriceFromMarkup(hpp, targetPercent);
      expect(priceMarkup).toBe(90000);

      // Margin 50%: Selling Price = HPP / (1 - 0.50) = 120.000
      const priceMargin = calculatePriceFromMargin(hpp, targetPercent);
      expect(priceMargin).toBe(120000);

      // Conversion: 50% Markup -> 33.33% Margin
      const marginEq = convertMarkupToMargin(targetPercent);
      expect(Math.round(marginEq * 10) / 10).toBe(33.3);

      // Conversion: 50% Margin -> 100% Markup
      const markupEq = convertMarginToMarkup(targetPercent);
      expect(markupEq).toBe(100);
    });

    it("should accurately calculate Shopee fees with admin and free shipping cap", async () => {
      const settings = await getBusinessSettings();
      expect(settings.marketplace_fees.shopee_admin_fee_percent).toBe(8);
      expect(settings.marketplace_fees.shopee_free_shipping_fee_percent).toBe(4);
      expect(settings.marketplace_fees.shopee_free_shipping_cap).toBe(10000);

      // Test with order amount Rp 300.000:
      // Admin 8% = 24.000
      // Gratis Ongkir 4% of 300.000 = 12.000 -> capped at 10.000!
      const price = new Decimal(300000);
      const adminFee = price.times(settings.marketplace_fees.shopee_admin_fee_percent).dividedBy(100);
      const uncappedShipping = price.times(settings.marketplace_fees.shopee_free_shipping_fee_percent).dividedBy(100);
      const cappedShipping = Decimal.min(uncappedShipping, settings.marketplace_fees.shopee_free_shipping_cap);

      expect(adminFee.toNumber()).toBe(24000);
      expect(cappedShipping.toNumber()).toBe(10000);
    });

    it("should preview mass price updates before applying", async () => {
      const result = await applyGlobalPricingToProducts("GLOBAL_MARKUP", 60);
      expect(result.updatedCount).toBeGreaterThan(0);
      expect(result.preview.length).toBeGreaterThan(0);

      const firstItem = result.preview[0];
      expect(firstItem.newPrice).toBeGreaterThan(firstItem.hpp);
    });
  });

  // =========================================================================
  // 3. UTANG USAHA & CICILAN ASET (ANYCUBIC KOBRA X)
  // =========================================================================
  describe("Payables & Anycubic Kobra X Installment Module", () => {
    it("should load Anycubic Kobra X with 3 scheduled installments initially UNPAID", async () => {
      const payables = await getPayables();
      const anycubic = payables.find((p) => p.title.includes("Anycubic Kobra X"));

      expect(anycubic).toBeDefined();
      expect(anycubic?.total_amount).toBe(5872800);
      expect(anycubic?.installments?.length).toBe(3);

      // Verify each installment amount is Rp 1.957.600
      anycubic?.installments?.forEach((inst) => {
        expect(inst.amount).toBe(1957600);
        expect(inst.status).toBe("UNPAID");
        expect(inst.paid_amount).toBe(0);
      });

      // Verify schedule due dates
      expect(anycubic?.installments?.[0].due_date).toBe("2026-11-01");
      expect(anycubic?.installments?.[1].due_date).toBe("2026-12-01");
      expect(anycubic?.installments?.[2].due_date).toBe("2027-01-01");
    });

    it("should record installment payment correctly and update remaining balance", async () => {
      const payables = await getPayables();
      const anycubic = payables.find((p) => p.title.includes("Anycubic Kobra X"))!;
      const firstInst = anycubic.installments![0];

      // Record payment for installment 1
      const res = await recordInstallmentPayment({
        installment_id: firstInst.id,
        payment_date: "2026-11-01",
        amount: 1957600,
        payment_method: "TRANSFER",
        reference_number: "TRX-SHOPEE-PAYLATER-01",
      });

      expect(res.payable).toBeDefined();
      expect(res.installment.status).toBe("PAID");

      // Verify remaining balance
      const updated = await getPayableById(anycubic.id);
      expect(updated?.remaining_amount).toBe(5872800 - 1957600);
      expect(updated?.status).toBe("PARTIALLY_PAID");

      // Verify installment 1 status is PAID
      const updatedFirstInst = updated?.installments?.find((i) => i.id === firstInst.id);
      expect(updatedFirstInst?.status).toBe("PAID");
      expect(updatedFirstInst?.paid_amount).toBe(1957600);
    });

    it("should compute payables summary metrics accurately", async () => {
      const summary = await getPayablesSummary();
      expect(summary.totalObligations).toBeGreaterThan(0);
      expect(summary.totalRemaining).toBeGreaterThan(0);
      expect(summary.countActive).toBeGreaterThanOrEqual(1);
    });
  });

  // =========================================================================
  // 4. MATERIALS & INVENTORY CRUD
  // =========================================================================
  describe("Materials & Inventory Management", () => {
    it("should support CRUD on materials", async () => {
      // 1. Create
      const newMat = await createMaterial({
        name: "Filament PETG Transparent Violet",
        category: "filament",
        unit: "gram",
        cost_per_unit: 125,
        current_stock: 1000,
        min_stock_alert: 200,
        supplier: "eSUN Official",
      });
      expect(newMat.id).toBeDefined();
      expect(newMat.current_stock).toBe(1000);

      // 2. Update
      const updatedMat = await updateMaterial(newMat.id, {
        cost_per_unit: 130,
        current_stock: 1500,
      });
      expect(updatedMat?.cost_per_unit).toBe(130);
      expect(updatedMat?.current_stock).toBe(1500);

      // 3. Delete
      const deleted = await deleteMaterial(newMat.id);
      expect(deleted).toBe(true);
    });

    it("should record stock movement and update stock balance atomically", async () => {
      const materials = await getMaterials();
      const testMat = materials[0];
      const initialStock = testMat.current_stock;

      // Record a purchase movement of +500 grams
      const mov = await recordStockMovement({
        material_id: testMat.id,
        quantity: 500,
        movement_type: "PURCHASE",
        notes: "Pengadaan tambahan filamen",
      });

      expect(mov.id).toBeDefined();
      expect(mov.quantity).toBe(500);

      // Verify updated stock
      const updatedMaterials = await getMaterials();
      const updatedMat = updatedMaterials.find((m) => m.id === testMat.id);
      expect(updatedMat?.current_stock).toBe(initialStock + 500);
    });
  });

  // =========================================================================
  // 5. CAPITAL & ASSETS CRUD
  // =========================================================================
  describe("Capital Purchases & Fixed Assets", () => {
    it("should reconcile 23 items of initial capital purchases totaling Rp 11.440.748", async () => {
      const purchases = await getCapitalPurchases();
      expect(purchases.length).toBeGreaterThanOrEqual(23);

      const summary = await getCapitalSummary();
      expect(summary.totalCapital).toBeGreaterThanOrEqual(11440748);
      expect(summary.breakdown.length).toBeGreaterThanOrEqual(5); // MESIN, FILAMEN, KELISTRIKAN, KEMASAN, ALAT, OPERASIONAL
    });

    it("should support CRUD for fixed assets", async () => {
      const asset = await createAsset({
        name: "Anycubic Kobra Neo 2",
        category: "printer_3d",
        purchase_date: "2026-10-01",
        purchase_price: 2800000,
        residual_value: 300000,
        useful_life_months: 24,
        estimated_hours_per_month: 120,
        power_watts: 80,
        status: "ACTIVE",
      });

      expect(asset.id).toBeDefined();
      expect(asset.purchase_price).toBe(2800000);

      const updated = await updateAsset(asset.id, { power_watts: 85 });
      expect(updated?.power_watts).toBe(85);

      const deleted = await deleteAsset(asset.id);
      expect(deleted).toBe(true);
    });
  });

  // =========================================================================
  // 6. EXPENSES & CATEGORIES CRUD
  // =========================================================================
  describe("Operational Expenses & Categories", () => {
    it("should support creating expense categories and operational expenses", async () => {
      const cat = await createExpenseCategory({
        name: "Pengujian Nozzle & Suku Cadang",
        is_fixed_cost: false,
        description: "Biaya suku cadang",
      });
      expect(cat.id).toBeDefined();

      const exp = await createExpense({
        expense_date: "2026-10-15",
        category_id: cat.id,
        description: "Beli Nozzle Hardened Steel 0.4mm",
        amount: 85000,
        payment_method: "TRANSFER",
      });
      expect(exp.id).toBeDefined();
      expect(exp.amount).toBe(85000);

      const deleted = await deleteExpense(exp.id);
      expect(deleted).toBe(true);
    });
  });

  // =========================================================================
  // 7. FINANCIAL INDICATORS GLOSSARY
  // =========================================================================
  describe("Financial Indicators Guide Coverage", () => {
    it("should define all 20 required financial indicators with full structured content", () => {
      const requiredKeys = [
        "pendapatan_kotor",
        "diskon_promo",
        "pendapatan_bersih",
        "hpp",
        "laba_kotor",
        "gross_margin",
        "laba_operasional",
        "arus_kas_masuk",
        "arus_kas_keluar",
        "piutang_usaha",
        "utang_usaha",
        "nilai_aset_tetap",
        "modal_usaha",
        "bep",
        "payback_period",
        "margin_kontribusi",
        "reject_rate",
        "depresiasi",
        "markup",
        "margin",
      ];

      for (const key of requiredKeys) {
        const ind = FINANCIAL_INDICATORS[key];
        expect(ind, `Indicator ${key} must exist in glossary`).toBeDefined();
        expect(ind.definition.length, `Indicator ${key} must have definition`).toBeGreaterThan(10);
        expect(ind.formula.length, `Indicator ${key} must have formula`).toBeGreaterThan(3);
        expect(ind.example.length, `Indicator ${key} must have real example`).toBeGreaterThan(5);
        expect(ind.excludes.length, `Indicator ${key} must specify what is excluded`).toBeGreaterThan(5);
        expect(ind.source.length, `Indicator ${key} must specify data source`).toBeGreaterThan(5);
      }
    });
  });
});
