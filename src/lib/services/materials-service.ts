import { INITIAL_MATERIALS } from "@/lib/data/initial-data";
import { Material } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";

export async function getMaterials(): Promise<Material[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("materials")
        .select("*")
        .order("category");

      if (!error && data && data.length > 0) {
        return data as Material[];
      }
    } catch {
      // Fallback
    }
  }

  return INITIAL_MATERIALS;
}

export async function getMaterialsSummary() {
  const materials = await getMaterials();
  const totalItems = materials.length;
  const filamentStockGrams = materials
    .filter((m) => m.category === "filament")
    .reduce((acc, curr) => acc + curr.current_stock, 0);

  const lowStockCount = materials.filter(
    (m) => m.current_stock <= m.min_stock_alert
  ).length;

  return {
    totalItems,
    filamentStockKg: filamentStockGrams / 1000,
    lowStockCount,
  };
}
