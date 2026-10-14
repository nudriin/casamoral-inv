"use server";

import { revalidatePath } from "next/cache";
import {
  createProduct,
  updateProduct,
  deleteOrArchiveProduct,
  toggleProductActive,
  createProductCategory,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/lib/services/products-service";

export async function createProductAction(payload: CreateProductPayload) {
  try {
    const product = await createProduct(payload);
    revalidatePath("/products");
    revalidatePath("/orders/new");
    revalidatePath("/calculator");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal membuat produk/model baru.";
    return { success: false, error: message };
  }
}

export async function updateProductAction(id: string, payload: UpdateProductPayload) {
  try {
    const product = await updateProduct(id, payload);
    revalidatePath("/products");
    revalidatePath("/orders/new");
    revalidatePath("/calculator");
    revalidatePath("/");
    return { success: true, product };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui produk.";
    return { success: false, error: message };
  }
}

export async function deleteOrArchiveProductAction(id: string): Promise<
  | { success: true; action: "DELETED" | "ARCHIVED"; message: string }
  | { success: false; error: string }
> {
  try {
    const result = await deleteOrArchiveProduct(id);
    revalidatePath("/products");
    revalidatePath("/orders/new");
    revalidatePath("/");
    return { success: true, action: result.action, message: result.message };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus/mengarsipkan produk.";
    return { success: false, error: message };
  }
}

export async function toggleProductActiveAction(id: string, isActive: boolean) {
  try {
    const product = await toggleProductActive(id, isActive);
    revalidatePath("/products");
    revalidatePath("/orders/new");
    return { success: true, product };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengubah status aktif produk.";
    return { success: false, error: message };
  }
}

export async function createProductCategoryAction(name: string) {
  try {
    const category = await createProductCategory(name);
    revalidatePath("/products");
    return { success: true, category };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambah kategori produk.";
    return { success: false, error: message };
  }
}
