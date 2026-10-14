import React from "react";
import { getProducts, getProductCategories } from "@/lib/services/products-service";
import { ProductsClient } from "./products-client";

export const metadata = {
  title: "Master Produk & Model | Casa Moral 3D Printing",
  description: "Katalog produk, varian model, Bill of Materials (BOM), kalkulasi HPP presisi, dan penetapan harga.",
};

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(true),
    getProductCategories(),
  ]);

  return <ProductsClient initialProducts={products} categories={categories} />;
}
