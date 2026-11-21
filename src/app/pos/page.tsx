import React from "react";
import { getProducts } from "@/lib/services/products-service";
import { getMaterials, getPackagingMaterials } from "@/lib/services/materials-service";
import { PosClient } from "./pos-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kasir POS — Penjualan & Realtime Margin | Casa Moral 3D Printing",
  description: "Layar Kasir POS untuk penjualan Direct dan Shopee dengan pilihan kemasan dinamis, pengurangan stok otomatis, dan kalkulasi laba bersih real-time.",
};

export default async function PosPage() {
  const [products, packagingMaterials, allMaterials] = await Promise.all([
    getProducts(),
    getPackagingMaterials(),
    getMaterials(),
  ]);

  return (
    <PosClient
      products={products}
      packagingMaterials={packagingMaterials}
      allMaterials={allMaterials}
    />
  );
}
