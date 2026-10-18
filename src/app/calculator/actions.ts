"use server";

import { revalidatePath } from "next/cache";
import {
  getProducts,
  createProduct,
  updateProduct,
} from "@/lib/services/products-service";

export interface SyncElsProductPayload {
  id?: string;
  name: string;
  sku?: string;
  selling_price: number;
  current_hpp: number;
  markup_percent: number;
  print_time_minutes: number;
  weight_gram: number;
  printer_name?: string;
  filament_brand?: string;
}

/**
 * Synchronize a calculated ELS Studio product item to Casa Moral Master Products Catalog
 */
export async function syncElsProductToMasterCatalogAction(payload: SyncElsProductPayload) {
  try {
    const products = await getProducts();
    const existing = products.find(
      (p) =>
        (payload.id && p.id === payload.id) ||
        (payload.sku && p.sku === payload.sku) ||
        p.name.toLowerCase() === payload.name.trim().toLowerCase()
    );

    if (existing) {
      // Update existing product with ELS Studio calculated numbers
      const updated = await updateProduct(existing.id, {
        name: payload.name.trim(),
        selling_price: payload.selling_price,
        current_hpp: payload.current_hpp,
        markup_percent: payload.markup_percent,
        calculation_mode: "ADVANCED",
        print_time_minutes: payload.print_time_minutes,
        bom: {
          ...existing.bom,
          totalFilamentGram: payload.weight_gram,
        },
      });

      revalidatePath("/products");
      revalidatePath("/pos");
      revalidatePath("/orders/new");
      revalidatePath("/calculator");
      revalidatePath("/");

      return {
        success: true,
        action: "UPDATED" as const,
        product: updated,
        message: `Produk "${updated.name}" berhasil disinkronkan ke Master Produk (HPP: ${payload.current_hpp}, Harga: ${payload.selling_price}).`,
      };
    } else {
      // Create new product in Master Catalog from Casa Moral Calculator
      const created = await createProduct({
        name: payload.name.trim(),
        sku: payload.sku || `CM-${Date.now().toString().slice(-4)}`,
        category_id: "cat-decor",
        product_type: "PRINTED",
        calculation_mode: "ADVANCED",
        selling_price: payload.selling_price,
        current_hpp: payload.current_hpp,
        markup_percent: payload.markup_percent,
        print_time_minutes: payload.print_time_minutes,
        bom: {
          totalFilamentGram: payload.weight_gram,
          filamentCost: payload.current_hpp * 0.4,
          electricalCost: 0,
          packagingCost: 4300,
        },
      });

      revalidatePath("/products");
      revalidatePath("/pos");
      revalidatePath("/orders/new");
      revalidatePath("/calculator");
      revalidatePath("/");

      return {
        success: true,
        action: "CREATED" as const,
        product: created,
        message: `Produk baru "${created.name}" berhasil ditambahkan ke Master Produk dari Kalkulator Casa Moral!`,
      };
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyinkronkan produk ke Master Katalog.";
    return { success: false, error: message };
  }
}

/**
 * Fetch products from master catalog to be imported into ELS Studio
 */
export async function fetchMasterProductsForElsAction() {
  try {
    const products = await getProducts();
    return {
      success: true,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || "",
        selling_price: p.selling_price,
        current_hpp: p.current_hpp,
        print_time_minutes: p.print_time_minutes || 60,
        total_filament_gram: p.bom?.totalFilamentGram || 100,
      })),
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data produk.";
    return { success: false, error: message, products: [] };
  }
}

/**
 * Batch synchronize multiple calculated ELS Studio product items to Casa Moral Master Products Catalog
 */
export async function batchSyncElsProductsAction(payloads: SyncElsProductPayload[]) {
  try {
    const products = await getProducts();
    let updatedCount = 0;
    let createdCount = 0;

    for (const payload of payloads) {
      const existing = products.find(
        (p) =>
          (payload.id && p.id === payload.id) ||
          (payload.sku && p.sku === payload.sku) ||
          p.name.toLowerCase() === payload.name.trim().toLowerCase()
      );

      if (existing) {
        await updateProduct(existing.id, {
          name: payload.name.trim(),
          selling_price: payload.selling_price,
          current_hpp: payload.current_hpp,
          markup_percent: payload.markup_percent,
          calculation_mode: "ADVANCED",
          print_time_minutes: payload.print_time_minutes,
          bom: {
            ...existing.bom,
            totalFilamentGram: payload.weight_gram,
          },
        });
        updatedCount++;
      } else {
        await createProduct({
          name: payload.name.trim(),
          sku: payload.sku || `CM-${Date.now().toString().slice(-4)}`,
          category_id: "cat-decor",
          product_type: "PRINTED",
          calculation_mode: "ADVANCED",
          selling_price: payload.selling_price,
          current_hpp: payload.current_hpp,
          markup_percent: payload.markup_percent,
          print_time_minutes: payload.print_time_minutes,
          bom: {
            totalFilamentGram: payload.weight_gram,
            filamentCost: payload.current_hpp * 0.4,
            electricalCost: 0,
            packagingCost: 4300,
          },
        });
        createdCount++;
      }
    }

    revalidatePath("/products");
    revalidatePath("/pos");
    revalidatePath("/orders/new");
    revalidatePath("/calculator");
    revalidatePath("/");

    return {
      success: true,
      updatedCount,
      createdCount,
      message: `Berhasil menyinkronkan ${payloads.length} produk ke Master Produk (${updatedCount} diperbarui, ${createdCount} dibuat baru).`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menyinkronkan produk batch ke Master Katalog.";
    return { success: false, error: message };
  }
}
