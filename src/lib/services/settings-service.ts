import {
  BusinessSettings,
  MarketplaceFeesSetting,
  GlobalPricingSetting,
  ProductionAssumptionsSetting,
} from "@/types/database";
import { getServiceSupabaseClient } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";
import { getProducts, updateProduct } from "@/lib/services/products-service";
import Decimal from "decimal.js";

// In-memory defaults
const DEFAULT_SETTINGS: BusinessSettings = {
  marketplace_fees: {
    shopee_admin_fee_percent: 8.0,
    shopee_free_shipping_fee_percent: 4.0,
    shopee_free_shipping_cap: 10000,
    extra_platform_fee: 0,
    promo_discount_borne_by_seller: 0,
  },
  global_pricing: {
    pricing_mode: "INDIVIDUAL",
    default_markup_percent: 50.0,
    default_margin_percent: 33.33,
    apply_to: "ALL",
  },
  production_assumptions: {
    electricity_rate_kwh: 1500,
    default_printer_power_watts: 120,
    labor_packing_cost: 10000,
    default_reject_rate: 0.10,
    default_overhead_multiplier: 1.20,
  },
};

const memorySettings: BusinessSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

/**
 * Fetch all business settings
 */
export async function getBusinessSettings(): Promise<BusinessSettings> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase.from("business_settings").select("*");

      if (!error && data && data.length > 0) {
        const fees = data.find((row) => row.key === "marketplace_fees")?.value;
        const pricing = data.find((row) => row.key === "global_pricing")?.value;
        const prod = data.find((row) => row.key === "production_assumptions")?.value;

        return {
          marketplace_fees: fees || memorySettings.marketplace_fees,
          global_pricing: pricing || memorySettings.global_pricing,
          production_assumptions: prod || memorySettings.production_assumptions,
        };
      }
    } catch {
      // Fallback
    }
  }

  return memorySettings;
}

/**
 * Update marketplace fees
 */
export async function updateMarketplaceFees(
  fees: Partial<MarketplaceFeesSetting>
): Promise<MarketplaceFeesSetting> {
  const updated: MarketplaceFeesSetting = {
    ...memorySettings.marketplace_fees,
    ...fees,
  };

  memorySettings.marketplace_fees = updated;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const current = await getBusinessSettings();
    const merged: MarketplaceFeesSetting = {
      ...current.marketplace_fees,
      ...fees,
    };
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("business_settings").upsert(
      {
        key: "marketplace_fees",
        value: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) {
      throw new Error(`Gagal menyimpan pengaturan biaya marketplace: ${error.message}`);
    }
    memorySettings.marketplace_fees = merged;
    return merged;
  }

  return updated;
}

/**
 * Update global pricing configuration
 */
export async function updateGlobalPricing(
  pricing: Partial<GlobalPricingSetting>
): Promise<GlobalPricingSetting> {
  const updated: GlobalPricingSetting = {
    ...memorySettings.global_pricing,
    ...pricing,
  };

  memorySettings.global_pricing = updated;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const current = await getBusinessSettings();
    const merged: GlobalPricingSetting = {
      ...current.global_pricing,
      ...pricing,
    };
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("business_settings").upsert(
      {
        key: "global_pricing",
        value: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) {
      throw new Error(`Gagal menyimpan pengaturan harga global: ${error.message}`);
    }
    memorySettings.global_pricing = merged;
    return merged;
  }

  return updated;
}

/**
 * Update production cost assumptions
 */
export async function updateProductionAssumptions(
  assumptions: Partial<ProductionAssumptionsSetting>
): Promise<ProductionAssumptionsSetting> {
  const updated: ProductionAssumptionsSetting = {
    ...memorySettings.production_assumptions,
    ...assumptions,
  };

  memorySettings.production_assumptions = updated;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const current = await getBusinessSettings();
    const merged: ProductionAssumptionsSetting = {
      ...current.production_assumptions,
      ...assumptions,
    };
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("business_settings").upsert(
      {
        key: "production_assumptions",
        value: merged,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) {
      throw new Error(`Gagal menyimpan asumsi produksi: ${error.message}`);
    }
    memorySettings.production_assumptions = merged;
    return merged;
  }

  return updated;
}

/**
 * Apply global markup or margin to products with preview calculation
 */
export async function applyGlobalPricingToProducts(
  mode: "GLOBAL_MARKUP" | "GLOBAL_MARGIN",
  percentValue: number,
  targetCategoryId?: string
): Promise<{
  updatedCount: number;
  preview: Array<{
    id: string;
    name: string;
    hpp: number;
    oldPrice: number;
    newPrice: number;
    marginPercent: number;
  }>;
}> {
  const products = await getProducts(false);
  const eligibleProducts = products.filter((p) => {
    if (targetCategoryId && targetCategoryId !== "ALL" && p.category_id !== targetCategoryId) {
      return false;
    }
    return true;
  });

  const percentDec = new Decimal(percentValue);
  const preview = [];

  for (const product of eligibleProducts) {
    const hppDec = new Decimal(product.current_hpp);
    let newPrice = 0;

    if (mode === "GLOBAL_MARKUP") {
      // Harga = HPP * (1 + Markup%)
      const markupMultiplier = new Decimal(1).plus(percentDec.dividedBy(100));
      newPrice = Math.ceil(hppDec.times(markupMultiplier).toNumber() / 1000) * 1000;
    } else {
      // Harga = HPP / (1 - Margin%)
      const marginRatio = new Decimal(1).minus(percentDec.dividedBy(100));
      if (marginRatio.lessThanOrEqualTo(0)) {
        throw new Error("Target margin tidak boleh >= 100%.");
      }
      newPrice = Math.ceil(hppDec.dividedBy(marginRatio).toNumber() / 1000) * 1000;
    }

    const calculatedMargin =
      newPrice > 0 ? ((newPrice - product.current_hpp) / newPrice) * 100 : 0;

    preview.push({
      id: product.id,
      name: product.name,
      hpp: product.current_hpp,
      oldPrice: product.selling_price,
      newPrice,
      marginPercent: calculatedMargin,
    });

    // Update product price & mark pricing source as GLOBAL
    await updateProduct(product.id, {
      selling_price: newPrice,
      markup_percent:
        mode === "GLOBAL_MARKUP"
          ? percentValue
          : product.current_hpp > 0
          ? ((newPrice - product.current_hpp) / product.current_hpp) * 100
          : 0,
      pricing_source: "GLOBAL",
    });
  }

  // Update setting state
  await updateGlobalPricing({
    pricing_mode: mode,
    default_markup_percent: mode === "GLOBAL_MARKUP" ? percentValue : memorySettings.global_pricing.default_markup_percent,
    default_margin_percent: mode === "GLOBAL_MARGIN" ? percentValue : memorySettings.global_pricing.default_margin_percent,
    apply_to: targetCategoryId && targetCategoryId !== "ALL" ? "CATEGORY" : "ALL",
    target_category_id: targetCategoryId,
  });

  return {
    updatedCount: preview.length,
    preview,
  };
}
