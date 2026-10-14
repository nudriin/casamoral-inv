import { INITIAL_CAPITAL_PURCHASES, INITIAL_ASSETS, CapitalPurchaseItem } from "@/lib/data/initial-data";
import { Asset } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";

export interface CapitalBreakdown {
  category: string;
  label: string;
  totalCost: number;
  itemCount: number;
  percentage: number;
}

// In-memory store for fallback/demo
let inMemoryAssets: Asset[] = [...INITIAL_ASSETS];
const inMemoryPurchases: CapitalPurchaseItem[] = [...INITIAL_CAPITAL_PURCHASES];

export async function getCapitalPurchases(): Promise<CapitalPurchaseItem[]> {
  return inMemoryPurchases;
}

export async function createCapitalPurchase(purchase: Omit<CapitalPurchaseItem, "id" | "totalCost"> & { totalCost?: number }): Promise<CapitalPurchaseItem> {
  const totalCost = purchase.totalCost ?? (purchase.unitPrice * purchase.quantity + purchase.serviceFee);
  const newPurchase: CapitalPurchaseItem = {
    id: `cap-${Date.now()}`,
    name: purchase.name,
    unitPrice: purchase.unitPrice,
    quantity: purchase.quantity,
    serviceFee: purchase.serviceFee,
    totalCost,
    category: purchase.category,
  };
  inMemoryPurchases.unshift(newPurchase);
  return newPurchase;
}

export async function getAssets(): Promise<Asset[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from("assets").select("*").order("purchase_price", { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Asset[];
      }
    } catch {
      // Fallback
    }
  }

  return inMemoryAssets;
}

export async function createAsset(asset: Omit<Asset, "id" | "created_at">): Promise<Asset> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from("assets").insert([asset]).select().single();
      if (!error && data) {
        return data as Asset;
      }
    } catch {
      // Fallback
    }
  }

  const newAsset: Asset = {
    ...asset,
    id: `asset-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  inMemoryAssets.unshift(newAsset);
  return newAsset;
}

export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset | null> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase.from("assets").update(updates).eq("id", id).select().single();
      if (!error && data) {
        return data as Asset;
      }
    } catch {
      // Fallback
    }
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

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (!error) return true;
    } catch {
      // Fallback
    }
  }

  const initialLen = inMemoryAssets.length;
  inMemoryAssets = inMemoryAssets.filter((a) => a.id !== id);
  return inMemoryAssets.length < initialLen;
}

export async function getCapitalSummary() {
  const purchases = await getCapitalPurchases();
  const totalAmount = purchases.reduce((sum, item) => sum + item.totalCost, 0);

  const categories: Record<string, { label: string; total: number; count: number }> = {
    MESIN: { label: "Mesin 3D Printer", total: 0, count: 0 },
    FILAMEN: { label: "Stok Filamen (Bahan Baku)", total: 0, count: 0 },
    KELISTRIKAN: { label: "Komponen Kelistrikan & Lampu", total: 0, count: 0 },
    KEMASAN: { label: "Kemasan & Packaging", total: 0, count: 0 },
    ALAT: { label: "Peralatan & Tools", total: 0, count: 0 },
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
