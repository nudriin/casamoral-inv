import { INITIAL_MATERIALS, INITIAL_STOCK_MOVEMENTS, INITIAL_PRODUCTS } from "@/lib/data/initial-data";
import { Material, StockMovement, StockMovementType, Order } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory store for fallback & testing
let memoryMaterials: Material[] = JSON.parse(JSON.stringify(INITIAL_MATERIALS));
let memoryMovements: StockMovement[] = JSON.parse(JSON.stringify(INITIAL_STOCK_MOVEMENTS));

export interface CreateStockMovementPayload {
  material_id: string;
  movement_type: StockMovementType;
  quantity: number; // positive for incoming/purchase/return, negative for production usage
  reference_id?: string;
  notes?: string;
}

/**
 * Fetch all materials
 */
export async function getMaterials(): Promise<Material[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from("materials").select("*").order("category");

      if (!error && data && data.length > 0) {
        return data as Material[];
      }
    } catch {
      // Fallback
    }
  }

  return memoryMaterials;
}

/**
 * Fetch stock movements audit log
 */
export async function getStockMovements(materialId?: string): Promise<StockMovement[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      let query = supabase.from("stock_movements").select("*").order("created_at", { ascending: false });

      if (materialId) {
        query = query.eq("material_id", materialId);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data as StockMovement[];
      }
    } catch {
      // Fallback
    }
  }

  let result = [...memoryMovements];
  if (materialId) {
    result = result.filter((m) => m.material_id === materialId);
  }
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Record a single stock movement and update current_stock
 */
export async function recordStockMovement(payload: CreateStockMovementPayload): Promise<StockMovement> {
  const material = memoryMaterials.find((m) => m.id === payload.material_id);
  if (!material) {
    throw new Error(`Material dengan ID ${payload.material_id} tidak ditemukan.`);
  }

  const currentStockDec = new Decimal(material.current_stock);
  const qtyDec = new Decimal(payload.quantity);
  const updatedStock = currentStockDec.plus(qtyDec);

  if (updatedStock.lessThan(0)) {
    // We allow stock to go slightly negative or cap at 0 with warning, but in production we prevent negative if strict
    // For realism, let's keep it non-negative
    material.current_stock = Math.max(0, updatedStock.toNumber());
  } else {
    material.current_stock = updatedStock.toNumber();
  }

  const nowIso = new Date().toISOString();
  const movement: StockMovement = {
    id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    material_id: material.id,
    movement_type: payload.movement_type,
    quantity: payload.quantity,
    reference_id: payload.reference_id || null,
    notes: payload.notes || null,
    created_at: nowIso,
  };

  memoryMovements.unshift(movement);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("materials").update({ current_stock: material.current_stock }).eq("id", material.id);
      await supabase.from("stock_movements").insert({
        id: movement.id,
        material_id: movement.material_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        reference_id: movement.reference_id,
        notes: movement.notes,
      });
    } catch {
      // Fallback
    }
  }

  return movement;
}

/**
 * Automatically deducts Bill of Materials (BOM) stock when an order begins IN_PRODUCTION
 */
export async function deductBOMStockForOrder(order: Order): Promise<StockMovement[]> {
  if (!order.items || order.items.length === 0) return [];

  // Check if this order has already had production usage deducted to avoid duplicate deductions
  const alreadyDeducted = memoryMovements.some(
    (m) => m.reference_id === order.id && m.movement_type === "PRODUCTION_USAGE"
  );
  if (alreadyDeducted) {
    return [];
  }

  const generatedMovements: StockMovement[] = [];

  for (const item of order.items) {
    const product = INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
    if (!product || !product.bom) continue;

    const qty = item.quantity || 1;

    // 1. Filament deduction (grams)
    const filamentGrams = new Decimal(product.bom.totalFilamentGram).times(qty).toNumber();
    if (filamentGrams > 0) {
      const mov = await recordStockMovement({
        material_id: "mat-01",
        movement_type: "PRODUCTION_USAGE",
        quantity: -filamentGrams,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${filamentGrams}g filamen (${qty}x ${product.name})`,
      });
      generatedMovements.push(mov);
    }

    // 2. LED Bulb Inlite 3W (1 pcs per unit)
    const bulbMov = await recordStockMovement({
      material_id: "mat-02",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Bohlam Inlite 3W`,
    });
    generatedMovements.push(bulbMov);

    // 3. Fitting E27 (1 pcs per unit)
    const fittingMov = await recordStockMovement({
      material_id: "mat-03",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Fitting E27`,
    });
    generatedMovements.push(fittingMov);

    // 4. Kabel Sakelar On/Off (1 pcs per unit)
    const switchMov = await recordStockMovement({
      material_id: "mat-04",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Kabel Sakelar`,
    });
    generatedMovements.push(switchMov);

    // 5. Karet Pelindung Kabel (1 pcs per unit)
    const protectorMov = await recordStockMovement({
      material_id: "mat-05",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Pelindung Kabel`,
    });
    generatedMovements.push(protectorMov);

    // 6. Kardus Kemasan Karton (1 pcs per unit)
    const boxMov = await recordStockMovement({
      material_id: "mat-06",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Kardus Kemasan`,
    });
    generatedMovements.push(boxMov);

    // 7. Bubble Wrap Roll (1 meter per unit)
    const bubbleMov = await recordStockMovement({
      material_id: "mat-07",
      movement_type: "PRODUCTION_USAGE",
      quantity: -qty,
      reference_id: order.id,
      notes: `Produksi ${order.order_number}: Pemakaian ${qty} m Bubble Wrap`,
    });
    generatedMovements.push(bubbleMov);
  }

  return generatedMovements;
}

/**
 * Restores previously deducted stock if an order is CANCELLED after entering production
 */
export async function restoreBOMStockForOrder(order: Order): Promise<StockMovement[]> {
  const previousUsages = memoryMovements.filter(
    (m) => m.reference_id === order.id && m.movement_type === "PRODUCTION_USAGE"
  );
  if (previousUsages.length === 0) return [];

  // Check if already returned
  const alreadyReturned = memoryMovements.some(
    (m) => m.reference_id === order.id && m.movement_type === "RETURN"
  );
  if (alreadyReturned) return [];

  const restoredMovements: StockMovement[] = [];

  for (const usage of previousUsages) {
    const restoreQty = Math.abs(usage.quantity);
    const mov = await recordStockMovement({
      material_id: usage.material_id,
      movement_type: "RETURN",
      quantity: restoreQty,
      reference_id: order.id,
      notes: `Pengembalian stok pembatalan pesanan ${order.order_number} (+${restoreQty})`,
    });
    restoredMovements.push(mov);
  }

  return restoredMovements;
}

/**
 * Summary metrics of raw materials
 */
export async function getMaterialsSummary() {
  const materials = await getMaterials();
  const totalItems = materials.length;
  const filamentStockGrams = materials
    .filter((m) => m.category === "filament")
    .reduce((acc, curr) => acc + curr.current_stock, 0);

  const lowStockCount = materials.filter((m) => m.current_stock <= m.min_stock_alert).length;

  return {
    totalItems,
    filamentStockKg: filamentStockGrams / 1000,
    lowStockCount,
  };
}

/**
 * Create a new raw material / component
 */
export async function createMaterial(payload: {
  name: string;
  category: Material["category"];
  unit: Material["unit"];
  current_stock: number;
  min_stock_alert: number;
  cost_per_unit: number;
  supplier?: string;
}): Promise<Material> {
  if (!payload.name || !payload.name.trim()) {
    throw new Error("Nama bahan baku / komponen wajib diisi.");
  }
  if (payload.cost_per_unit < 0) {
    throw new Error("Biaya satuan tidak boleh negatif.");
  }

  const nowIso = new Date().toISOString();
  const newMaterial: Material = {
    id: `mat-${Date.now()}`,
    name: payload.name.trim(),
    category: payload.category,
    unit: payload.unit,
    current_stock: Math.max(0, payload.current_stock || 0),
    min_stock_alert: Math.max(0, payload.min_stock_alert || 0),
    cost_per_unit: payload.cost_per_unit,
    supplier: payload.supplier?.trim() || null,
    created_at: nowIso,
    updated_at: nowIso,
  };

  memoryMaterials.push(newMaterial);

  // If initial stock > 0, log an initial stock movement
  if (newMaterial.current_stock > 0) {
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      material_id: newMaterial.id,
      movement_type: "PURCHASE",
      quantity: newMaterial.current_stock,
      notes: "Saldo awal persediaan bahan baku",
      created_at: nowIso,
    };
    memoryMovements.unshift(movement);
  }

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("materials").insert({
        id: newMaterial.id,
        name: newMaterial.name,
        category: newMaterial.category,
        unit: newMaterial.unit,
        current_stock: newMaterial.current_stock,
        min_stock_alert: newMaterial.min_stock_alert,
        cost_per_unit: newMaterial.cost_per_unit,
        supplier: newMaterial.supplier,
      });
    } catch {
      // Fallback
    }
  }

  return newMaterial;
}

/**
 * Update an existing material
 */
export async function updateMaterial(
  id: string,
  payload: Partial<Omit<Material, "id" | "created_at">>
): Promise<Material> {
  const index = memoryMaterials.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Bahan baku ID "${id}" tidak ditemukan.`);
  }

  const existing = memoryMaterials[index];
  const updated: Material = {
    ...existing,
    ...payload,
    updated_at: new Date().toISOString(),
  };

  memoryMaterials[index] = updated;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("materials").update(payload).eq("id", id);
    } catch {
      // Fallback
    }
  }

  return updated;
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string): Promise<boolean> {
  const index = memoryMaterials.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Bahan baku ID "${id}" tidak ditemukan.`);
  }

  memoryMaterials.splice(index, 1);

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.from("materials").delete().eq("id", id);
    } catch {
      // Fallback
    }
  }

  return true;
}

/**
 * Reset memory materials and movements (for automated testing isolation)
 */
export function resetMemoryMaterials(): void {
  memoryMaterials = JSON.parse(JSON.stringify(INITIAL_MATERIALS));
  memoryMovements = JSON.parse(JSON.stringify(INITIAL_STOCK_MOVEMENTS));
}

