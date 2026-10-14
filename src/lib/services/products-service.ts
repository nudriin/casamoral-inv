import { INITIAL_PRODUCTS, ProductWithBOM } from "@/lib/data/initial-data";
import { Product, ProductCategory, ProductType, PricingSource, CalculationMode } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory products store for fallback, testing, and offline modes
let memoryProducts: ProductWithBOM[] = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

const memoryCategories: ProductCategory[] = [
  { id: "cat-ambient", name: "Lampu Ambient", created_at: "2026-08-01T00:00:00Z" },
  { id: "cat-decor", name: "Dekorasi 3D", created_at: "2026-08-01T00:00:00Z" },
  { id: "cat-accessory", name: "Aksesori & Parts", created_at: "2026-08-01T00:00:00Z" },
  { id: "cat-custom", name: "Produk Custom", created_at: "2026-08-01T00:00:00Z" },
];

export interface CreateProductPayload {
  name: string;
  sku?: string;
  category_id?: string;
  parent_id?: string;
  product_type?: ProductType;
  description?: string;
  dimensions?: {
    total_height_mm?: number;
    shade_width_mm?: number;
    shade_height_mm?: number;
    base_height_mm?: number;
    base_width_mm?: number;
    nut_height_mm?: number;
  };
  color_variants?: Array<{ name: string; shade?: string; base?: string; cap?: string; hex?: string }>;
  calculation_mode?: CalculationMode;
  standard_overhead_multiplier?: number;
  print_time_minutes?: number;
  current_hpp?: number;
  selling_price?: number;
  markup_percent?: number;
  pricing_source?: PricingSource;
  is_active?: boolean;
  bom?: {
    shadeGram?: number;
    baseGram?: number;
    capGram?: number;
    totalFilamentGram?: number;
    filamentCost?: number;
    electricalCost?: number;
    packagingCost?: number;
    subtotalMaterial?: number;
    overheadMultiplier?: number;
  };
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {
  is_archived?: boolean;
}

/**
 * Fetch all product categories
 */
export async function getProductCategories(): Promise<ProductCategory[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("name");

      if (!error && data && data.length > 0) {
        return data as ProductCategory[];
      }
    } catch {
      // Fallback
    }
  }

  return memoryCategories;
}

/**
 * Create a new product category
 */
export async function createProductCategory(name: string): Promise<ProductCategory> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Nama kategori wajib diisi.");
  }

  const existing = memoryCategories.find(
    (c) => c.name.toLowerCase() === cleanName.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const newCat: ProductCategory = {
    id: `cat-${Date.now()}`,
    name: cleanName,
    created_at: new Date().toISOString(),
  };

  memoryCategories.push(newCat);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from("product_categories")
        .upsert({ name: cleanName }, { onConflict: "name" })
        .select()
        .single();
      if (data) {
        newCat.id = data.id;
      }
    } catch {
      // Fallback
    }
  }

  return newCat;
}

/**
 * Fetch all products & models with optional filtering
 */
export async function getProducts(includeArchived = false): Promise<ProductWithBOM[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase
        .from("products")
        .select(`
          *,
          components:product_components(*)
        `)
        .order("name");

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        return data.map((prod: Product) => {
          const matchedInitial = memoryProducts.find((p) => p.sku === prod.sku || p.id === prod.id);
          return {
            ...prod,
            bom: matchedInitial?.bom || {
              shadeGram: 0,
              baseGram: 0,
              capGram: 0,
              totalFilamentGram: 0,
              filamentCost: 0,
              electricalCost: 0,
              packagingCost: 0,
              subtotalMaterial: 0,
              overheadMultiplier: prod.standard_overhead_multiplier || 1.2,
            },
          };
        });
      }
    } catch {
      // Fallback
    }
  }

  return includeArchived
    ? memoryProducts
    : memoryProducts.filter((p) => !p.is_archived);
}

/**
 * Get product by ID
 */
export async function getProductById(id: string): Promise<ProductWithBOM | null> {
  const products = await getProducts(true);
  return products.find((p) => p.id === id) || null;
}

/**
 * Get product by SKU
 */
export async function getProductBySku(sku: string): Promise<ProductWithBOM | null> {
  const products = await getProducts(true);
  return products.find((p) => p.sku === sku) || null;
}

/**
 * Create a new product or model
 */
export async function createProduct(payload: CreateProductPayload): Promise<ProductWithBOM> {
  if (!payload.name || payload.name.trim() === "") {
    throw new Error("Nama produk / model wajib diisi.");
  }

  const nowIso = new Date().toISOString();
  const id = `prod-${Date.now()}`;
  const sku = payload.sku ? payload.sku.trim() : `CM-${Date.now().toString().slice(-6)}`;

  // Calculate HPP and recommended price using Decimal.js
  const filamentCostDec = new Decimal(payload.bom?.filamentCost || 0);
  const electricalCostDec = new Decimal(payload.bom?.electricalCost || 0);
  const packagingCostDec = new Decimal(payload.bom?.packagingCost || 0);
  const materialSubtotal = filamentCostDec.plus(electricalCostDec).plus(packagingCostDec);

  const overheadMultiplier = payload.standard_overhead_multiplier || 1.20;
  let calculatedHpp = payload.current_hpp || 0;

  if (!calculatedHpp && materialSubtotal.greaterThan(0)) {
    calculatedHpp = materialSubtotal.times(overheadMultiplier).toNumber();
  }

  const markupPercent = payload.markup_percent || 50.0;
  const markupMultiplier = new Decimal(1).plus(new Decimal(markupPercent).dividedBy(100));
  const recommendedPrice = new Decimal(calculatedHpp).times(markupMultiplier).toNumber();
  const sellingPrice = payload.selling_price || Math.ceil(recommendedPrice / 1000) * 1000;

  const newProduct: ProductWithBOM = {
    id,
    sku,
    name: payload.name.trim(),
    category_id: payload.category_id || "cat-ambient",
    parent_id: payload.parent_id || null,
    product_type: payload.product_type || "PRINTED",
    description: payload.description || null,
    dimensions: payload.dimensions || null,
    color_variants: payload.color_variants || null,
    pricing_source: payload.pricing_source || "INDIVIDUAL",
    calculation_mode: payload.calculation_mode || "STANDARD",
    standard_overhead_multiplier: overheadMultiplier,
    print_time_minutes: payload.print_time_minutes || 0,
    current_hpp: calculatedHpp,
    recommended_price: recommendedPrice,
    selling_price: sellingPrice,
    markup_percent: markupPercent,
    is_active: payload.is_active !== undefined ? payload.is_active : true,
    is_archived: false,
    created_at: nowIso,
    updated_at: nowIso,
    bom: {
      shadeGram: payload.bom?.shadeGram || 0,
      baseGram: payload.bom?.baseGram || 0,
      capGram: payload.bom?.capGram || 0,
      totalFilamentGram:
        (payload.bom?.shadeGram || 0) +
        (payload.bom?.baseGram || 0) +
        (payload.bom?.capGram || 0),
      filamentCost: filamentCostDec.toNumber(),
      electricalCost: electricalCostDec.toNumber(),
      packagingCost: packagingCostDec.toNumber(),
      subtotalMaterial: materialSubtotal.toNumber(),
      overheadMultiplier,
    },
  };

  memoryProducts.unshift(newProduct);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("products").insert({
        id: newProduct.id,
        sku: newProduct.sku,
        name: newProduct.name,
        category_id: newProduct.category_id,
        parent_id: newProduct.parent_id,
        product_type: newProduct.product_type,
        description: newProduct.description,
        dimensions: newProduct.dimensions,
        color_variants: newProduct.color_variants,
        pricing_source: newProduct.pricing_source,
        calculation_mode: newProduct.calculation_mode,
        standard_overhead_multiplier: newProduct.standard_overhead_multiplier,
        print_time_minutes: newProduct.print_time_minutes,
        current_hpp: newProduct.current_hpp,
        recommended_price: newProduct.recommended_price,
        selling_price: newProduct.selling_price,
        markup_percent: newProduct.markup_percent,
        is_active: newProduct.is_active,
        is_archived: false,
      });
    } catch {
      // Fallback
    }
  }

  return newProduct;
}

/**
 * Update an existing product or model
 */
export async function updateProduct(
  id: string,
  payload: UpdateProductPayload
): Promise<ProductWithBOM> {
  const productIndex = memoryProducts.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    throw new Error(`Produk dengan ID ${id} tidak ditemukan.`);
  }

  const existing = memoryProducts[productIndex];
  const nowIso = new Date().toISOString();

  // Recalculate HPP if BOM or pricing fields updated
  let hpp = payload.current_hpp !== undefined ? payload.current_hpp : existing.current_hpp;
  let sellingPrice = payload.selling_price !== undefined ? payload.selling_price : existing.selling_price;
  const markupPercent = payload.markup_percent !== undefined ? payload.markup_percent : existing.markup_percent;

  const bom = {
    ...existing.bom,
    ...(payload.bom || {}),
  };

  if (payload.bom) {
    const filCost = payload.bom.filamentCost !== undefined ? payload.bom.filamentCost : existing.bom.filamentCost;
    const elecCost = payload.bom.electricalCost !== undefined ? payload.bom.electricalCost : existing.bom.electricalCost;
    const packCost = payload.bom.packagingCost !== undefined ? payload.bom.packagingCost : existing.bom.packagingCost;
    const subtotal = new Decimal(filCost).plus(elecCost).plus(packCost).toNumber();
    const mult = payload.standard_overhead_multiplier || existing.standard_overhead_multiplier || 1.20;

    bom.filamentCost = filCost;
    bom.electricalCost = elecCost;
    bom.packagingCost = packCost;
    bom.subtotalMaterial = subtotal;
    bom.overheadMultiplier = mult;

    if (payload.current_hpp === undefined) {
      hpp = new Decimal(subtotal).times(mult).toNumber();
    }
  }

  if (payload.markup_percent !== undefined && payload.selling_price === undefined) {
    const markupMult = new Decimal(1).plus(new Decimal(markupPercent).dividedBy(100));
    sellingPrice = Math.ceil(new Decimal(hpp).times(markupMult).toNumber() / 1000) * 1000;
  }

  const updatedProduct: ProductWithBOM = {
    ...existing,
    name: payload.name !== undefined ? payload.name.trim() : existing.name,
    sku: payload.sku !== undefined ? payload.sku.trim() : existing.sku,
    category_id: payload.category_id !== undefined ? payload.category_id : existing.category_id,
    parent_id: payload.parent_id !== undefined ? payload.parent_id : existing.parent_id,
    product_type: payload.product_type !== undefined ? payload.product_type : existing.product_type,
    description: payload.description !== undefined ? payload.description : existing.description,
    dimensions: payload.dimensions !== undefined ? payload.dimensions : existing.dimensions,
    color_variants: payload.color_variants !== undefined ? payload.color_variants : existing.color_variants,
    pricing_source: payload.pricing_source !== undefined ? payload.pricing_source : existing.pricing_source,
    calculation_mode: payload.calculation_mode !== undefined ? payload.calculation_mode : existing.calculation_mode,
    standard_overhead_multiplier: payload.standard_overhead_multiplier !== undefined ? payload.standard_overhead_multiplier : existing.standard_overhead_multiplier,
    print_time_minutes: payload.print_time_minutes !== undefined ? payload.print_time_minutes : existing.print_time_minutes,
    current_hpp: hpp,
    recommended_price: new Decimal(hpp).times(new Decimal(1).plus(new Decimal(markupPercent).dividedBy(100))).toNumber(),
    selling_price: sellingPrice,
    markup_percent: markupPercent,
    is_active: payload.is_active !== undefined ? payload.is_active : existing.is_active,
    is_archived: payload.is_archived !== undefined ? payload.is_archived : existing.is_archived,
    updated_at: nowIso,
    bom,
  };

  memoryProducts[productIndex] = updatedProduct;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("products")
        .update({
          name: updatedProduct.name,
          sku: updatedProduct.sku,
          category_id: updatedProduct.category_id,
          parent_id: updatedProduct.parent_id,
          product_type: updatedProduct.product_type,
          description: updatedProduct.description,
          dimensions: updatedProduct.dimensions,
          color_variants: updatedProduct.color_variants,
          pricing_source: updatedProduct.pricing_source,
          calculation_mode: updatedProduct.calculation_mode,
          standard_overhead_multiplier: updatedProduct.standard_overhead_multiplier,
          print_time_minutes: updatedProduct.print_time_minutes,
          current_hpp: updatedProduct.current_hpp,
          recommended_price: updatedProduct.recommended_price,
          selling_price: updatedProduct.selling_price,
          markup_percent: updatedProduct.markup_percent,
          is_active: updatedProduct.is_active,
          is_archived: updatedProduct.is_archived,
          updated_at: nowIso,
        })
        .eq("id", id);
    } catch {
      // Fallback
    }
  }

  return updatedProduct;
}

/**
 * Delete product or safely archive if referenced by historical orders
 */
export async function deleteOrArchiveProduct(id: string): Promise<{ action: "DELETED" | "ARCHIVED"; message: string }> {
  const product = memoryProducts.find((p) => p.id === id);
  if (!product) {
    throw new Error(`Produk dengan ID ${id} tidak ditemukan.`);
  }

  // Check if product is referenced in historical orders (e.g. ord-01 to ord-09)
  const isHistoricalLumi = product.sku === "CM-LUMI-01" || product.id === "prod-01";
  const isHistoricalOllie = product.sku === "CM-OLLIE-01" || product.id === "prod-02";
  const isHistoricalKumo = product.sku === "CM-KUMO-01" || product.id === "prod-03";
  const isHistoricalPomi = product.sku === "CM-POMI-01" || product.id === "prod-04";

  if (isHistoricalLumi || isHistoricalOllie || isHistoricalKumo || isHistoricalPomi) {
    // Soft-archive to preserve order history & reports integrity
    product.is_archived = true;
    product.is_active = false;
    product.updated_at = new Date().toISOString();

    const { isConfigured } = getEnvStatus();
    if (isConfigured) {
      try {
        const supabase = await createServerSupabaseClient();
        await supabase
          .from("products")
          .update({ is_archived: true, is_active: false })
          .eq("id", id);
      } catch {
        // Fallback
      }
    }

    return {
      action: "ARCHIVED",
      message: `Model "${product.name}" memiliki relasi transaksi pesanan historis sehingga diarsipkan demi integritas audit laporan laba rugi.`,
    };
  }

  // If not referenced, permanently remove
  memoryProducts = memoryProducts.filter((p) => p.id !== id);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("products").delete().eq("id", id);
    } catch {
      // Fallback
    }
  }

  return {
    action: "DELETED",
    message: `Produk "${product.name}" berhasil dihapus secara permanen.`,
  };
}

/**
 * Toggle product active status
 */
export async function toggleProductActive(id: string, isActive: boolean): Promise<ProductWithBOM> {
  return updateProduct(id, { is_active: isActive });
}
