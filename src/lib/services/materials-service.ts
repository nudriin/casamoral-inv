import {
  INITIAL_MATERIALS,
  INITIAL_STOCK_MOVEMENTS,
  STORE_STOCK_MOVEMENTS,
  ALL_STOCK_MOVEMENTS,
  INITIAL_PRODUCTS,
  ALL_PRODUCTS,
} from "@/lib/data/initial-data";
import { Material, StockMovement, StockMovementType, Order } from "@/types/database";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";
import Decimal from "decimal.js";

// In-memory store for fallback & testing
let memoryMaterials: Material[] = JSON.parse(JSON.stringify(INITIAL_MATERIALS));
let memoryMovements: StockMovement[] = JSON.parse(JSON.stringify(ALL_STOCK_MOVEMENTS));

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
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase.from("materials").select("*").order("category");

      if (!error && data && data.length > 0) {
        const dbMaterials = data as Material[];
        const dbNames = new Set(dbMaterials.map((m) => m.name.toLowerCase().trim()));
        const remainingInitial = memoryMaterials.filter(
          (m) => !dbMaterials.some((d) => d.id === m.id) && !dbNames.has(m.name.toLowerCase().trim())
        );
        return [...dbMaterials, ...remainingInitial];
      }
    } catch (err) {
      console.error("[materials-service] getMaterials exception:", err);
    }
  }

  return memoryMaterials;
}

/**
 * Fetch a single material by ID
 */
export async function getMaterialById(id: string): Promise<Material | undefined> {
  const materials = await getMaterials();
  return materials.find((m) => m.id === id);
}

/**
 * Fetch stock movements audit log
 */
export async function getStockMovements(materialId?: string): Promise<StockMovement[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      let query = supabase.from("stock_movements").select("*").order("created_at", { ascending: false });

      if (materialId && isValidUuid(materialId)) {
        query = query.eq("material_id", materialId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        if (materialId && !isValidUuid(materialId)) {
          return [];
        }
        return data as StockMovement[];
      }
      if (error) {
        console.error("[materials-service] getStockMovements error:", error.message);
      }
    } catch (err) {
      console.error("[materials-service] getStockMovements exception:", err);
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
  const { isConfigured } = getEnvStatus();
  const nowIso = new Date().toISOString();
  const movementId = crypto.randomUUID();

  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    let dbMaterial: Material | null = null;

    if (isValidUuid(payload.material_id)) {
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("id", payload.material_id)
        .maybeSingle();
      if (data) dbMaterial = data as Material;
    }

    if (!dbMaterial) {
      const memMatch = memoryMaterials.find((m) => m.id === payload.material_id);
      if (memMatch) {
        const { data: byName } = await supabase
          .from("materials")
          .select("*")
          .ilike("name", memMatch.name)
          .limit(1)
          .maybeSingle();

        if (byName) {
          dbMaterial = byName as Material;
        } else {
          // Material came from initial-data fallback and hasn't been persisted to Supabase yet -> create it now
          const { data: createdMat, error: createErr } = await supabase
            .from("materials")
            .insert({
              id: crypto.randomUUID(),
              name: memMatch.name,
              category: memMatch.category,
              unit: memMatch.unit,
              current_stock: memMatch.current_stock,
              min_stock_alert: memMatch.min_stock_alert,
              cost_per_unit: memMatch.cost_per_unit,
              supplier: memMatch.supplier,
            })
            .select()
            .single();
          if (createErr || !createdMat) {
            throw new Error(`Gagal menyinkronkan bahan baku ke database: ${createErr?.message}`);
          }
          dbMaterial = createdMat as Material;
        }
      }
    }

    if (!dbMaterial) {
      throw new Error(`Material dengan ID ${payload.material_id} tidak ditemukan di database.`);
    }

    const currentStockDec = new Decimal(dbMaterial.current_stock);
    const updatedStockDec = currentStockDec.plus(new Decimal(payload.quantity));
    const newStock = updatedStockDec.lessThan(0) ? 0 : updatedStockDec.toNumber();

    const { error: updateError } = await supabase
      .from("materials")
      .update({ current_stock: newStock, updated_at: nowIso })
      .eq("id", dbMaterial.id);

    if (updateError) {
      throw new Error(`Gagal memperbarui stok bahan di database: ${updateError.message}`);
    }

    // Keep in-memory copy in sync as well
    const memIdx = memoryMaterials.findIndex(
      (m) => m.id === payload.material_id || m.name.toLowerCase() === dbMaterial!.name.toLowerCase()
    );
    if (memIdx !== -1) {
      memoryMaterials[memIdx].current_stock = newStock;
      memoryMaterials[memIdx].updated_at = nowIso;
    }

    const { data: insertedMovement, error: insertError } = await supabase
      .from("stock_movements")
      .insert({
        id: movementId,
        material_id: dbMaterial.id,
        movement_type: payload.movement_type,
        quantity: payload.quantity,
        reference_id: isValidUuid(payload.reference_id) ? payload.reference_id : null,
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Gagal mencatat mutasi stok ke database: ${insertError.message}`);
    }

    return insertedMovement as StockMovement;
  }

  const material = memoryMaterials.find((m) => m.id === payload.material_id);
  if (!material) {
    throw new Error(`Material dengan ID ${payload.material_id} tidak ditemukan.`);
  }

  const currentStockDec = new Decimal(material.current_stock);
  const qtyDec = new Decimal(payload.quantity);
  const updatedStock = currentStockDec.plus(qtyDec);

  if (updatedStock.lessThan(0)) {
    material.current_stock = Math.max(0, updatedStock.toNumber());
  } else {
    material.current_stock = updatedStock.toNumber();
  }

  const movement: StockMovement = {
    id: movementId,
    material_id: material.id,
    movement_type: payload.movement_type,
    quantity: payload.quantity,
    reference_id: payload.reference_id || null,
    notes: payload.notes || null,
    created_at: nowIso,
  };

  memoryMovements.unshift(movement);
  return movement;
}

/**
 * Automatically deducts Bill of Materials (BOM) stock when an order begins IN_PRODUCTION
 */
export async function deductBOMStockForOrder(order: Order): Promise<StockMovement[]> {
  if (!order.items || order.items.length === 0) return [];

  const { isConfigured } = getEnvStatus();
  const availableMaterials = await getMaterials();
  const resolveMatId = (fallbackId: string, keywords: string[]): string | null => {
    const exact = availableMaterials.find((m) => m.id === fallbackId);
    if (exact) return exact.id;
    const byKeyword = availableMaterials.find((m) =>
      keywords.some((kw) => m.name.toLowerCase().includes(kw.toLowerCase()))
    );
    return byKeyword ? byKeyword.id : (isConfigured ? null : fallbackId);
  };

  if (isConfigured && isValidUuid(order.id)) {
    const supabase = await getServiceSupabaseClient();
    const { data: existingMovs } = await supabase
      .from("stock_movements")
      .select("id")
      .eq("reference_id", order.id)
      .eq("movement_type", "PRODUCTION_USAGE")
      .limit(1);
    if (existingMovs && existingMovs.length > 0) {
      return [];
    }
  } else {
    // Check if this order has already had production usage deducted to avoid duplicate deductions
    const alreadyDeducted = memoryMovements.some(
      (m) => m.reference_id === order.id && m.movement_type === "PRODUCTION_USAGE"
    );
    if (alreadyDeducted) {
      return [];
    }
  }

  const generatedMovements: StockMovement[] = [];

  for (const item of order.items) {
    const product = ALL_PRODUCTS.find((p) => p.id === item.product_id) || INITIAL_PRODUCTS.find((p) => p.id === item.product_id);
    if (!product || !product.bom) continue;

    const qty = item.quantity || 1;

    // 1. Filament deduction (grams)
    const filamentGrams = new Decimal(product.bom.totalFilamentGram).times(qty).toNumber();
    const matFilament = resolveMatId("mat-01", ["filamen", "pla", "petg"]);
    if (filamentGrams > 0 && matFilament) {
      const mov = await recordStockMovement({
        material_id: matFilament,
        movement_type: "PRODUCTION_USAGE",
        quantity: -filamentGrams,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${filamentGrams}g filamen (${qty}x ${product.name})`,
      });
      generatedMovements.push(mov);
    }

    // 2. LED Bulb Inlite 3W (1 pcs per unit)
    const matBulb = resolveMatId("mat-02", ["inlite", "bohlam", "led"]);
    if (matBulb) {
      const bulbMov = await recordStockMovement({
        material_id: matBulb,
        movement_type: "PRODUCTION_USAGE",
        quantity: -qty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Bohlam Inlite 3W`,
      });
      generatedMovements.push(bulbMov);
    }

    // 3. Fitting E27 (1 pcs per unit)
    const matFitting = resolveMatId("mat-03", ["fitting"]);
    if (matFitting) {
      const fittingMov = await recordStockMovement({
        material_id: matFitting,
        movement_type: "PRODUCTION_USAGE",
        quantity: -qty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Fitting E27`,
      });
      generatedMovements.push(fittingMov);
    }

    // 4. Kabel Sakelar On/Off (1 pcs per unit)
    const matSwitch = resolveMatId("mat-04", ["sakelar", "kabel"]);
    if (matSwitch) {
      const switchMov = await recordStockMovement({
        material_id: matSwitch,
        movement_type: "PRODUCTION_USAGE",
        quantity: -qty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Kabel Sakelar`,
      });
      generatedMovements.push(switchMov);
    }

    // 5. Karet Pelindung Kabel (1 pcs per unit)
    const matProtector = resolveMatId("mat-05", ["pelindung"]);
    if (matProtector) {
      const protectorMov = await recordStockMovement({
        material_id: matProtector,
        movement_type: "PRODUCTION_USAGE",
        quantity: -qty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Pelindung Kabel`,
      });
      generatedMovements.push(protectorMov);
    }

    // 6. Kardus Kemasan Karton (1 pcs per unit)
    const matBox = resolveMatId("mat-06", ["kardus", "karton"]);
    if (matBox) {
      const boxMov = await recordStockMovement({
        material_id: matBox,
        movement_type: "PRODUCTION_USAGE",
        quantity: -qty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${qty} pcs Kardus Kemasan`,
      });
      generatedMovements.push(boxMov);
    }

    // 7. Bubble Wrap Roll (240 cm = 2.4 meter per unit pesanan real)
    const bubbleMeters = new Decimal(2.4).times(qty).toNumber();
    const matBubble = resolveMatId("mat-07", ["bubble"]);
    if (matBubble) {
      const bubbleMov = await recordStockMovement({
        material_id: matBubble,
        movement_type: "PRODUCTION_USAGE",
        quantity: -bubbleMeters,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${bubbleMeters} m (${240 * qty} cm) Bubble Wrap`,
      });
      generatedMovements.push(bubbleMov);
    }

    // 8. Kertas Packing Honeycomb (160 cm = 1.6 meter per unit pesanan real)
    const honeycombMeters = new Decimal(1.6).times(qty).toNumber();
    const matHoneycomb = resolveMatId("mat-08", ["honeycomb"]);
    if (matHoneycomb) {
      const honeycombMov = await recordStockMovement({
        material_id: matHoneycomb,
        movement_type: "PRODUCTION_USAGE",
        quantity: -honeycombMeters,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${honeycombMeters} m (${160 * qty} cm) Kertas Honeycomb`,
      });
      generatedMovements.push(honeycombMov);
    }

    // 9. Skun Jarum Pipih (2 pcs per unit pesanan real)
    const skunQty = 2 * qty;
    const matSkun = resolveMatId("mat-09", ["skun"]);
    if (matSkun) {
      const skunMov = await recordStockMovement({
        material_id: matSkun,
        movement_type: "PRODUCTION_USAGE",
        quantity: -skunQty,
        reference_id: order.id,
        notes: `Produksi ${order.order_number}: Pemakaian ${skunQty} pcs Skun Jarum Pipih`,
      });
      generatedMovements.push(skunMov);
    }
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
  const materialId = crypto.randomUUID();
  const initialStock = Math.max(0, payload.current_stock || 0);
  const minAlert = Math.max(0, payload.min_stock_alert || 0);
  const supplier = payload.supplier?.trim() || null;

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("materials")
      .insert({
        id: materialId,
        name: payload.name.trim(),
        category: payload.category,
        unit: payload.unit,
        current_stock: initialStock,
        min_stock_alert: minAlert,
        cost_per_unit: payload.cost_per_unit,
        supplier,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menambah bahan baku ke database: ${error.message}`);
    }

    if (initialStock > 0) {
      const { error: movError } = await supabase.from("stock_movements").insert({
        id: crypto.randomUUID(),
        material_id: materialId,
        movement_type: "PURCHASE",
        quantity: initialStock,
        notes: "Saldo awal persediaan bahan baku",
      });
      if (movError) {
        throw new Error(`Bahan berhasil dibuat namun gagal mencatat saldo awal mutasi stok: ${movError.message}`);
      }
    }

    return data as Material;
  }

  const newMaterial: Material = {
    id: materialId,
    name: payload.name.trim(),
    category: payload.category,
    unit: payload.unit,
    current_stock: initialStock,
    min_stock_alert: minAlert,
    cost_per_unit: payload.cost_per_unit,
    supplier,
    created_at: nowIso,
    updated_at: nowIso,
  };

  memoryMaterials.push(newMaterial);

  if (newMaterial.current_stock > 0) {
    const movement: StockMovement = {
      id: crypto.randomUUID(),
      material_id: newMaterial.id,
      movement_type: "PURCHASE",
      quantity: newMaterial.current_stock,
      notes: "Saldo awal persediaan bahan baku",
      created_at: nowIso,
    };
    memoryMovements.unshift(movement);
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
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("materials")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal memperbarui bahan baku di database: ${error.message}`);
    }
    return data as Material;
  }

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
  return updated;
}

/**
 * Delete a material
 */
export async function deleteMaterial(id: string): Promise<boolean> {
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("materials").delete().eq("id", id);
    if (error) {
      throw new Error(`Gagal menghapus bahan baku di database: ${error.message}`);
    }
    return true;
  }

  const index = memoryMaterials.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Bahan baku ID "${id}" tidak ditemukan.`);
  }

  memoryMaterials.splice(index, 1);
  return true;
}

export interface SelectedPackagingItem {
  material_id: string;
  name: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
}

/**
 * Fetch all materials categorized under packaging
 */
export async function getPackagingMaterials(): Promise<Material[]> {
  const materials = await getMaterials();
  return materials.filter((m) => m.category === "packaging");
}

/**
 * Deducts selected packaging materials for a POS order and logs stock movements
 */
export async function deductPackagingStockForOrder(
  orderId: string,
  orderNumber: string,
  packagingItems: SelectedPackagingItem[]
): Promise<StockMovement[]> {
  const movements: StockMovement[] = [];
  for (const pkg of packagingItems) {
    if (!pkg.material_id || pkg.quantity <= 0) continue;
    const mov = await recordStockMovement({
      material_id: pkg.material_id,
      movement_type: "PRODUCTION_USAGE",
      quantity: -pkg.quantity,
      reference_id: orderId,
      notes: `Penjualan Kasir POS (${orderNumber}): Pengurangan ${pkg.quantity}x ${pkg.name}`,
    });
    movements.push(mov);
  }
  return movements;
}

export interface CheckoutDeductionItem {
  material_id: string;
  name: string;
  quantity: number; // positive number to deduct
  unit?: string;
}

/**
 * Deducts custom selected materials (filament, lamp, cable, box, honeycomb, bubble wrap, etc.)
 * chosen by user during checkout
 */
export async function deductCustomCheckoutStock(
  orderId: string,
  orderNumber: string,
  deductions: CheckoutDeductionItem[]
): Promise<StockMovement[]> {
  const generatedMovements: StockMovement[] = [];

  for (const item of deductions) {
    if (!item.material_id || item.quantity <= 0) continue;
    const mov = await recordStockMovement({
      material_id: item.material_id,
      movement_type: "PRODUCTION_USAGE",
      quantity: -item.quantity,
      reference_id: orderId,
      notes: `Checkout ${orderNumber}: Pemakaian ${item.quantity} ${item.unit || ""} ${item.name}`,
    });
    generatedMovements.push(mov);
  }

  return generatedMovements;
}

export interface AdjustMaterialStockPayload {
  material_id: string;
  physical_stock: number;
  reason: string;
  notes?: string;
}

/**
 * Adjust stock to match physical stock opname results
 */
export async function adjustMaterialStock(
  payload: AdjustMaterialStockPayload
): Promise<{ material: Material; movement: StockMovement; difference: number }> {
  const materials = await getMaterials();
  const material = materials.find((m) => m.id === payload.material_id);
  if (!material) {
    throw new Error(`Bahan baku dengan ID "${payload.material_id}" tidak ditemukan.`);
  }

  const systemStock = material.current_stock;
  const targetStock = Math.max(0, payload.physical_stock);
  const difference = new Decimal(targetStock).minus(systemStock).toNumber();

  if (difference === 0) {
    return { material, movement: null as any, difference: 0 };
  }

  const movementType: StockMovementType = difference < 0 ? "WASTE_ADJUSTMENT" : "MANUAL_CORRECTION";
  const notes = `Penyesuaian Stock Opname: ${payload.reason}${payload.notes ? ` (${payload.notes})` : ""} [Sistem: ${systemStock} ${material.unit} -> Fisik: ${targetStock} ${material.unit}, Selisih: ${difference > 0 ? "+" : ""}${difference} ${material.unit}]`;

  const movement = await recordStockMovement({
    material_id: material.id,
    movement_type: movementType,
    quantity: difference,
    notes,
  });

  material.current_stock = targetStock;
  material.updated_at = movement.created_at;

  return { material, movement, difference };
}

/**
 * Reset memory materials and movements (for automated testing isolation)
 */
export function resetMemoryMaterials(initialOnly = false): void {
  memoryMaterials = JSON.parse(JSON.stringify(INITIAL_MATERIALS));
  memoryMovements = JSON.parse(
    JSON.stringify(initialOnly ? INITIAL_STOCK_MOVEMENTS : ALL_STOCK_MOVEMENTS)
  );
}


