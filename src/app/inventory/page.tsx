import { getMaterials, getMaterialsSummary, getStockMovements } from "@/lib/services/materials-service";
import { InventoryClient } from "./inventory-client";

export default async function InventoryPage() {
  const [materials, summary, movements] = await Promise.all([
    getMaterials(),
    getMaterialsSummary(),
    getStockMovements(),
  ]);

  return (
    <InventoryClient
      initialMaterials={materials}
      summary={summary}
      initialMovements={movements}
    />
  );
}

