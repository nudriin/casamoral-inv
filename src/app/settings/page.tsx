import React from "react";
import { getBusinessSettings } from "@/lib/services/settings-service";
import { getProductCategories, getProducts } from "@/lib/services/products-service";
import { SettingsClient } from "./settings-client";

export const metadata = {
  title: "Pengaturan Bisnis & Biaya | Casa Moral 3D Printing",
  description: "Konfigurasi tarif platform marketplace, penetapan harga jual global (Markup vs Margin), dan asumsi biaya produksi.",
};

export default async function SettingsPage() {
  const [settings, categories, products] = await Promise.all([
    getBusinessSettings(),
    getProductCategories(),
    getProducts(true),
  ]);

  return (
    <SettingsClient
      initialSettings={settings}
      categories={categories}
      products={products}
    />
  );
}
