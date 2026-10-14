import { INITIAL_PRODUCTS, ProductWithBOM } from "@/lib/data/initial-data";
import { Product } from "@/types/database";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getEnvStatus } from "@/lib/env";

export async function getProducts(): Promise<ProductWithBOM[]> {
  const { isConfigured } = getEnvStatus();

  if (isConfigured) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          components:product_components(*)
        `)
        .order("name");

      if (!error && data && data.length > 0) {
        // Map database records to ProductWithBOM
        return data.map((prod: Product) => {
          const matchedInitial = INITIAL_PRODUCTS.find((p) => p.sku === prod.sku);
          return {
            ...prod,
            bom: matchedInitial?.bom || {
              shadeGram: 0,
              baseGram: 0,
              capGram: 0,
              totalFilamentGram: 0,
              filamentCost: 0,
              electricalCost: 31700,
              packagingCost: 6500,
              subtotalMaterial: 0,
              overheadMultiplier: 1.2,
            },
          };
        });
      }
    } catch {
      // Fallback to validated local initial dataset if database is offline
    }
  }

  return INITIAL_PRODUCTS;
}

export async function getProductBySku(sku: string): Promise<ProductWithBOM | null> {
  const products = await getProducts();
  return products.find((p) => p.sku === sku) || null;
}
