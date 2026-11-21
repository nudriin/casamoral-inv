import React from "react";
import { getProducts } from "@/lib/services/products-service";
import { getMaterials } from "@/lib/services/materials-service";
import { NewOrderClient } from "./new-order-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Input Pesanan Baru | Casa Moral 3D Printing",
  description: "Formulir pesanan omnichannel dengan kustomisasi warna, simulasi laba kotor, dan penguncian snapshot HPP.",
};

export default async function NewOrderPage() {
  const [products, materials] = await Promise.all([
    getProducts(false),
    getMaterials(),
  ]);

  return <NewOrderClient products={products} materials={materials} />;
}
