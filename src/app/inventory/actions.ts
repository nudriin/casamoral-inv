"use server";

import { revalidatePath } from "next/cache";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  recordStockMovement,
  CreateStockMovementPayload,
} from "@/lib/services/materials-service";
import { Material } from "@/types/database";

export async function createMaterialAction(payload: {
  name: string;
  category: Material["category"];
  unit: Material["unit"];
  current_stock: number;
  min_stock_alert: number;
  cost_per_unit: number;
  supplier?: string;
}) {
  try {
    const material = await createMaterial(payload);
    revalidatePath("/inventory");
    revalidatePath("/products");
    revalidatePath("/calculator");
    return { success: true, material };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambah bahan baku.";
    return { success: false, error: message };
  }
}

export async function updateMaterialAction(
  id: string,
  payload: Partial<Omit<Material, "id" | "created_at">>
) {
  try {
    const material = await updateMaterial(id, payload);
    revalidatePath("/inventory");
    revalidatePath("/products");
    return { success: true, material };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui bahan baku.";
    return { success: false, error: message };
  }
}

export async function deleteMaterialAction(id: string) {
  try {
    await deleteMaterial(id);
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus bahan baku.";
    return { success: false, error: message };
  }
}

export async function recordStockMovementAction(payload: CreateStockMovementPayload) {
  try {
    const movement = await recordStockMovement(payload);
    revalidatePath("/inventory");
    revalidatePath("/products");
    return { success: true, movement };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mencatat mutasi stok.";
    return { success: false, error: message };
  }
}
