import React from "react";
import { getProducts } from "@/lib/services/products-service";
import { NewOrderClient } from "./new-order-client";

export const metadata = {
  title: "Input Pesanan Baru | Casa Moral 3D Printing",
  description: "Formulir pesanan omnichannel dengan kustomisasi warna, simulasi laba kotor, dan penguncian snapshot HPP.",
};

export default async function NewOrderPage() {
  const products = await getProducts(false);

  return <NewOrderClient products={products} />;
}
