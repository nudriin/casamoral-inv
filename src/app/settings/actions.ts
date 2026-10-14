"use server";

import { revalidatePath } from "next/cache";
import {
  updateMarketplaceFees,
  updateGlobalPricing,
  updateProductionAssumptions,
  applyGlobalPricingToProducts,
} from "@/lib/services/settings-service";
import {
  MarketplaceFeesSetting,
  GlobalPricingSetting,
  ProductionAssumptionsSetting,
} from "@/types/database";

export async function updateMarketplaceFeesAction(fees: Partial<MarketplaceFeesSetting>) {
  try {
    const updated = await updateMarketplaceFees(fees);
    revalidatePath("/settings");
    revalidatePath("/calculator");
    revalidatePath("/orders/new");
    revalidatePath("/reports/profit-loss");
    return { success: true, fees: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui biaya platform.";
    return { success: false, error: message };
  }
}

export async function updateGlobalPricingAction(pricing: Partial<GlobalPricingSetting>) {
  try {
    const updated = await updateGlobalPricing(pricing);
    revalidatePath("/settings");
    revalidatePath("/products");
    return { success: true, pricing: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui pengaturan harga.";
    return { success: false, error: message };
  }
}

export async function updateProductionAssumptionsAction(assumptions: Partial<ProductionAssumptionsSetting>) {
  try {
    const updated = await updateProductionAssumptions(assumptions);
    revalidatePath("/settings");
    revalidatePath("/calculator");
    revalidatePath("/products");
    return { success: true, assumptions: updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui asumsi biaya produksi.";
    return { success: false, error: message };
  }
}

export async function applyGlobalPricingToProductsAction(
  mode: "GLOBAL_MARKUP" | "GLOBAL_MARGIN",
  percentValue: number,
  targetCategoryId?: string
) {
  try {
    const result = await applyGlobalPricingToProducts(mode, percentValue, targetCategoryId);
    revalidatePath("/settings");
    revalidatePath("/products");
    revalidatePath("/calculator");
    revalidatePath("/orders/new");
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menerapkan harga global ke produk.";
    return { success: false, error: message };
  }
}
