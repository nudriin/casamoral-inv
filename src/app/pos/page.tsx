import React from "react";
import { getProducts } from "@/lib/services/products-service";
import { getPackagingMaterials } from "@/lib/services/materials-service";
import { PosClient } from "./pos-client";

export const metadata = {
  title: "Kasir POS — Penjualan & Realtime Margin | Casa Moral 3D Printing",
  description: "Layar Kasir POS untuk penjualan Direct dan Shopee dengan pilihan kemasan dinamis, pengurangan stok otomatis, dan kalkulasi laba bersih real-time.",
};

export default async function PosPage() {
  const [products, packagingMaterials] = await Promise.all([
    getProducts(),
    getPackagingMaterials(),
  ]);

  return (
    <PosClient
      products={products}
      packagingMaterials={packagingMaterials}
    />
  );
}
