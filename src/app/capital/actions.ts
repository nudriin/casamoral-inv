"use server";

import { revalidatePath } from "next/cache";
import {
  createAsset,
  updateAsset,
  deleteAsset,
  createCapitalPurchase,
  updateCapitalPurchase,
  deleteCapitalPurchase,
} from "@/lib/services/capital-service";
import { Asset } from "@/types/database";
import { CapitalPurchaseItem } from "@/lib/data/initial-data";

export type ActionResult<T = unknown> = 
  | { success: true; data: T; message?: string }
  | { success: false; error: string };

export async function createAssetAction(formData: FormData): Promise<ActionResult<Asset>> {
  try {
    const name = formData.get("name")?.toString().trim();
    const category = formData.get("category")?.toString() as Asset["category"];
    const purchaseDate = formData.get("purchase_date")?.toString() || new Date().toISOString().split("T")[0];
    const purchasePrice = parseFloat(formData.get("purchase_price")?.toString() || "0");
    const residualValue = parseFloat(formData.get("residual_value")?.toString() || "0");
    const usefulLifeMonths = parseInt(formData.get("useful_life_months")?.toString() || "24", 10);
    const estimatedHoursPerMonth = parseFloat(formData.get("estimated_hours_per_month")?.toString() || "150");
    const powerWatts = parseFloat(formData.get("power_watts")?.toString() || "100");

    if (!name || purchasePrice <= 0) {
      return { success: false, error: "Nama aset dan harga perolehan wajib diisi dengan benar." };
    }

    const newAsset = await createAsset({
      name,
      category: category || "printer_3d",
      purchase_date: purchaseDate,
      purchase_price: purchasePrice,
      residual_value: residualValue,
      useful_life_months: usefulLifeMonths,
      estimated_hours_per_month: estimatedHoursPerMonth,
      power_watts: powerWatts,
      status: "ACTIVE",
    });

    revalidatePath("/capital");
    revalidatePath("/calculator");
    return { success: true, data: newAsset, message: "Aset berhasil ditambahkan!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambahkan aset." };
  }
}

export async function updateAssetAction(id: string, formData: FormData): Promise<ActionResult<Asset>> {
  try {
    const name = formData.get("name")?.toString().trim();
    const category = formData.get("category")?.toString() as Asset["category"];
    const purchasePrice = parseFloat(formData.get("purchase_price")?.toString() || "0");
    const residualValue = parseFloat(formData.get("residual_value")?.toString() || "0");
    const usefulLifeMonths = parseInt(formData.get("useful_life_months")?.toString() || "24", 10);
    const estimatedHoursPerMonth = parseFloat(formData.get("estimated_hours_per_month")?.toString() || "150");
    const powerWatts = parseFloat(formData.get("power_watts")?.toString() || "100");
    const status = formData.get("status")?.toString() as Asset["status"];

    const updated = await updateAsset(id, {
      ...(name ? { name } : {}),
      ...(category ? { category } : {}),
      ...(purchasePrice > 0 ? { purchase_price: purchasePrice } : {}),
      ...(residualValue >= 0 ? { residual_value: residualValue } : {}),
      ...(usefulLifeMonths > 0 ? { useful_life_months: usefulLifeMonths } : {}),
      ...(estimatedHoursPerMonth > 0 ? { estimated_hours_per_month: estimatedHoursPerMonth } : {}),
      ...(powerWatts >= 0 ? { power_watts: powerWatts } : {}),
      ...(status ? { status } : {}),
    });

    if (!updated) {
      return { success: false, error: "Aset tidak ditemukan." };
    }

    revalidatePath("/capital");
    revalidatePath("/calculator");
    return { success: true, data: updated, message: "Aset berhasil diperbarui!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui aset." };
  }
}

export async function deleteAssetAction(id: string): Promise<ActionResult<boolean>> {
  try {
    const success = await deleteAsset(id);
    if (!success) {
      return { success: false, error: "Gagal menghapus aset." };
    }
    revalidatePath("/capital");
    return { success: true, data: true, message: "Aset berhasil dihapus!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus aset." };
  }
}

export async function createCapitalPurchaseAction(formData: FormData): Promise<ActionResult<CapitalPurchaseItem>> {
  try {
    const name = formData.get("name")?.toString().trim();
    const category = formData.get("category")?.toString() as CapitalPurchaseItem["category"];
    const unitPrice = parseFloat(formData.get("unit_price")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "1", 10);
    const serviceFee = parseFloat(formData.get("service_fee")?.toString() || "0");
    const purchaseDate = formData.get("purchase_date")?.toString().trim() || new Date().toISOString().split("T")[0];
    const storeLocation = formData.get("store_location")?.toString().trim() || undefined;

    if (!name || unitPrice <= 0 || quantity <= 0) {
      return { success: false, error: "Nama transaksi, harga satuan, dan kuantitas wajib diisi." };
    }

    const item = await createCapitalPurchase({
      name,
      category: category || "ALAT",
      unitPrice,
      quantity,
      serviceFee,
      purchaseDate,
      storeLocation,
    });

    revalidatePath("/capital");
    return { success: true, data: item, message: "Catatan belanja modal berhasil ditambahkan!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mencatat belanja modal." };
  }
}

export async function updateCapitalPurchaseAction(
  id: string,
  formData: FormData
): Promise<ActionResult<CapitalPurchaseItem>> {
  try {
    const name = formData.get("name")?.toString().trim();
    const category = formData.get("category")?.toString() as CapitalPurchaseItem["category"];
    const unitPrice = parseFloat(formData.get("unit_price")?.toString() || "0");
    const quantity = parseInt(formData.get("quantity")?.toString() || "1", 10);
    const serviceFee = parseFloat(formData.get("service_fee")?.toString() || "0");
    const purchaseDate = formData.get("purchase_date")?.toString().trim() || undefined;
    const storeLocation = formData.get("store_location")?.toString().trim() || "";

    if (!name || unitPrice <= 0 || quantity <= 0) {
      return { success: false, error: "Nama transaksi, harga satuan, dan kuantitas wajib diisi." };
    }

    const updated = await updateCapitalPurchase(id, {
      name,
      category: category || "ALAT",
      unitPrice,
      quantity,
      serviceFee,
      ...(purchaseDate ? { purchaseDate } : {}),
      storeLocation: storeLocation || undefined,
    });

    if (!updated) {
      return { success: false, error: "Transaksi belanja modal tidak ditemukan." };
    }

    revalidatePath("/capital");
    return { success: true, data: updated, message: "Transaksi belanja modal berhasil diperbarui!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui belanja modal." };
  }
}

export async function deleteCapitalPurchaseAction(id: string): Promise<ActionResult<boolean>> {
  try {
    const success = await deleteCapitalPurchase(id);
    if (!success) {
      return { success: false, error: "Transaksi belanja modal tidak ditemukan." };
    }
    revalidatePath("/capital");
    return { success: true, data: true, message: "Transaksi belanja modal berhasil dihapus!" };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus belanja modal." };
  }
}
