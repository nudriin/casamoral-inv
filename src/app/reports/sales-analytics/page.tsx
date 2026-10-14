import React from "react";
import { getSalesAnalytics } from "@/lib/services/reports-service";
import { SalesAnalyticsClient } from "./sales-analytics-client";

export const metadata = {
  title: "Analitik Produk & Penjualan | Casa Moral 3D Printing",
  description: "Matriks performa 4 model lampu ambient, pangsa omzet, margin kotor per SKU, dan estimasi beban cetak.",
};

export default async function SalesAnalyticsPage() {
  const analytics = await getSalesAnalytics();

  return (
    <SalesAnalyticsClient analytics={analytics} />
  );
}
