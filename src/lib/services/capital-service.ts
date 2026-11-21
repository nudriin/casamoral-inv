import {
  INITIAL_CAPITAL_PURCHASES,
  STORE_PURCHASES,
  ALL_CAPITAL_PURCHASES,
  INITIAL_ASSETS,
  STORE_ASSETS,
  ALL_ASSETS,
  CapitalPurchaseItem,
} from "@/lib/data/initial-data";
import { Asset } from "@/types/database";
import { getServiceSupabaseClient, isValidUuid } from "@/lib/supabase/db";
import { getEnvStatus } from "@/lib/env";

interface CapitalPurchaseRow {
  id: string;
  name: string;
  unit_price: number | string;
  quantity: number;
  service_fee: number | string;
  total_cost: number | string;
  category: CapitalPurchaseItem["category"];
  purchase_date: string;
  account?: string | null;
  store_location?: string | null;
}

function mapPurchaseRow(row: CapitalPurchaseRow): CapitalPurchaseItem {
  return {
    id: row.id,
    name: row.name,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    serviceFee: Number(row.service_fee),
    totalCost: Number(row.total_cost),
    category: row.category,
    purchaseDate: row.purchase_date,
    account: row.account || undefined,
    storeLocation: row.store_location || undefined,
  };
}

export interface CapitalBreakdown {
  category: string;
  label: string;
  totalCost: number;
  itemCount: number;
  percentage: number;
}

// In-memory store for fallback/demo
let inMemoryAssets: Asset[] = [...ALL_ASSETS];
let inMemoryPurchases: CapitalPurchaseItem[] = [...ALL_CAPITAL_PURCHASES];

export async function getCapitalPurchases(options?: { initialOnly?: boolean }): Promise<CapitalPurchaseItem[]> {
  if (options?.initialOnly) {
    return [...INITIAL_CAPITAL_PURCHASES];
  }

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase
        .from("capital_purchases")
        .select("*")
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const dbRows = (data as CapitalPurchaseRow[]).map(mapPurchaseRow);
        const dbKeys = new Set(dbRows.map((r) => `${r.name.toLowerCase()}::${r.purchaseDate || ""}`));
        const remainingInitial = inMemoryPurchases.filter(
          (p) => !dbRows.some((d) => d.id === p.id) && !dbKeys.has(`${p.name.toLowerCase()}::${p.purchaseDate || ""}`)
        );
        return [...dbRows, ...remainingInitial];
      }
      if (error) {
        console.warn("[capital-service] getCapitalPurchases warning (fallback to in-memory):", error.message);
      }
    } catch (err) {
      console.warn("[capital-service] getCapitalPurchases fallback:", err);
    }
  }

  return inMemoryPurchases;
}

export async function createCapitalPurchase(purchase: Omit<CapitalPurchaseItem, "id" | "totalCost"> & { totalCost?: number }): Promise<CapitalPurchaseItem> {
  const totalCost = purchase.totalCost ?? (purchase.unitPrice * purchase.quantity + purchase.serviceFee);
  const purchaseDate = purchase.purchaseDate || new Date().toISOString().split("T")[0];
  const id = crypto.randomUUID();

  const { isConfigured } = getEnvStatus();
  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("capital_purchases")
      .insert({
        id,
        name: purchase.name,
        unit_price: purchase.unitPrice,
        quantity: purchase.quantity,
        service_fee: purchase.serviceFee,
        total_cost: totalCost,
        category: purchase.category,
        purchase_date: purchaseDate,
        account: purchase.account || null,
        store_location: purchase.storeLocation || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal menyimpan belanja modal ke database: ${error.message}`);
    }
    return mapPurchaseRow(data as CapitalPurchaseRow);
  }

  const newPurchase: CapitalPurchaseItem = {
    id,
    name: purchase.name,
    unitPrice: purchase.unitPrice,
    quantity: purchase.quantity,
    serviceFee: purchase.serviceFee,
    totalCost,
    category: purchase.category,
    purchaseDate,
    account: purchase.account,
    storeLocation: purchase.storeLocation,
  };
  inMemoryPurchases.unshift(newPurchase);
  return newPurchase;
}

export async function updateCapitalPurchase(
  id: string,
  updates: Partial<Omit<CapitalPurchaseItem, "id">>
): Promise<CapitalPurchaseItem | null> {
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { data: currentRow, error: fetchError } = await supabase
      .from("capital_purchases")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !currentRow) {
      throw new Error(`Transaksi modal tidak ditemukan di database: ${fetchError?.message || id}`);
    }

    const current = mapPurchaseRow(currentRow as CapitalPurchaseRow);
    const unitPrice = updates.unitPrice ?? current.unitPrice;
    const quantity = updates.quantity ?? current.quantity;
    const serviceFee = updates.serviceFee ?? current.serviceFee;
    const totalCost = updates.totalCost ?? (unitPrice * quantity + serviceFee);

    const { data, error } = await supabase
      .from("capital_purchases")
      .update({
        name: updates.name ?? current.name,
        unit_price: unitPrice,
        quantity,
        service_fee: serviceFee,
        total_cost: totalCost,
        category: updates.category ?? current.category,
        purchase_date: updates.purchaseDate ?? current.purchaseDate,
        account: updates.account !== undefined ? (updates.account || null) : (current.account || null),
        store_location: updates.storeLocation !== undefined ? (updates.storeLocation || null) : (current.storeLocation || null),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Gagal memperbarui belanja modal di database: ${error.message}`);
    }
    return mapPurchaseRow(data as CapitalPurchaseRow);
  }

  const index = inMemoryPurchases.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = inMemoryPurchases[index];
  const unitPrice = updates.unitPrice ?? current.unitPrice;
  const quantity = updates.quantity ?? current.quantity;
  const serviceFee = updates.serviceFee ?? current.serviceFee;
  const totalCost = updates.totalCost ?? (unitPrice * quantity + serviceFee);

  const updated: CapitalPurchaseItem = {
    ...current,
    ...updates,
    unitPrice,
    quantity,
    serviceFee,
    totalCost,
  };
  inMemoryPurchases[index] = updated;
  return updated;
}

export async function deleteCapitalPurchase(id: string): Promise<boolean> {
  const { isConfigured } = getEnvStatus();
  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("capital_purchases").delete().eq("id", id);
    if (error) {
      throw new Error(`Gagal menghapus belanja modal di database: ${error.message}`);
    }
    return true;
  }

  const initialLen = inMemoryPurchases.length;
  inMemoryPurchases = inMemoryPurchases.filter((p) => p.id !== id);
  return inMemoryPurchases.length < initialLen;
}

export async function getAssets(): Promise<Asset[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await getServiceSupabaseClient();
      const { data, error } = await supabase.from("assets").select("*").order("purchase_price", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Asset[];
      }
      if (error) {
        console.error("[capital-service] getAssets error:", error.message);
      }
    } catch (err) {
      console.error("[capital-service] getAssets exception:", err);
    }
  }

  return inMemoryAssets;
}

export async function createAsset(asset: Omit<Asset, "id" | "created_at">): Promise<Asset> {
  const { isConfigured } = getEnvStatus();
  const id = crypto.randomUUID();

  if (isConfigured) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase.from("assets").insert([{ ...asset, id }]).select().single();
    if (error) {
      throw new Error(`Gagal menyimpan aset ke database: ${error.message}`);
    }
    return data as Asset;
  }

  const newAsset: Asset = {
    ...asset,
    id,
    created_at: new Date().toISOString(),
  };
  inMemoryAssets.unshift(newAsset);
  return newAsset;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { data, error } = await supabase.from("assets").update(updates).eq("id", id).select().single();
    if (error) {
      throw new Error(`Gagal memperbarui aset di database: ${error.message}`);
    }
    return data as Asset;
  }

  const index = inMemoryAssets.findIndex((a) => a.id === id);
  if (index !== -1) {
    inMemoryAssets[index] = { ...inMemoryAssets[index], ...updates };
    return inMemoryAssets[index];
  }
  return null;
}

export async function deleteAsset(id: string): Promise<boolean> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured && isValidUuid(id)) {
    const supabase = await getServiceSupabaseClient();
    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      throw new Error(`Gagal menghapus aset di database: ${error.message}`);
    }
    return true;
  }

  const initialLen = inMemoryAssets.length;
  inMemoryAssets = inMemoryAssets.filter((a) => a.id !== id);
  return inMemoryAssets.length < initialLen;
}

export async function getCapitalSummary(options?: { initialOnly?: boolean }) {
  const purchases = await getCapitalPurchases(options);
  const totalAmount = purchases.reduce((sum, item) => sum + item.totalCost, 0);

  const categories: Record<string, { label: string; total: number; count: number }> = {
    MESIN: { label: "Mesin 3D Printer", total: 0, count: 0 },
    FILAMEN: { label: "Stok Filamen (Bahan Baku)", total: 0, count: 0 },
    KELISTRIKAN: { label: "Komponen Kelistrikan & Lampu", total: 0, count: 0 },
    KEMASAN: { label: "Kemasan & Packaging", total: 0, count: 0 },
    ALAT: { label: "Peralatan & Tools", total: 0, count: 0 },
    OPERASIONAL: { label: "Iklan, Software & Operasional", total: 0, count: 0 },
  };

  purchases.forEach((item) => {
    if (categories[item.category]) {
      categories[item.category].total += item.totalCost;
      categories[item.category].count += 1;
    }
  });

  const breakdown: CapitalBreakdown[] = Object.entries(categories).map(([category, val]) => ({
    category,
    label: val.label,
    totalCost: val.total,
    itemCount: val.count,
    percentage: totalAmount > 0 ? (val.total / totalAmount) * 100 : 0,
  }));

  return {
    totalCapital: totalAmount,
    totalItems: purchases.length,
    breakdown,
  };
}

export function resetMemoryCapital(initialOnly = false) {
  if (initialOnly) {
    inMemoryAssets = [...INITIAL_ASSETS];
    inMemoryPurchases = [...INITIAL_CAPITAL_PURCHASES];
  } else {
    inMemoryAssets = [...ALL_ASSETS];
    inMemoryPurchases = [...ALL_CAPITAL_PURCHASES];
  }
}

