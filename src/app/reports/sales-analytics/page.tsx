import React from "react";
import { getSalesAnalytics } from "@/lib/services/reports-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SalesAnalyticsClient } from "./sales-analytics-client";

export const metadata = {
  title: "Analitik Produk & Penjualan | Casa Moral 3D Printing",
  description: "Matriks performa 4 model lampu ambient, pangsa omzet, margin kotor per SKU, dan estimasi beban cetak.",
};

export default async function SalesAnalyticsPage() {
  const analytics = await getSalesAnalytics();

  return (
    <DashboardShell
      title="Analisis Penjualan & Performa Produk"
      subtitle="Evaluasi Profitabilitas per Model Lampu, Volume Terjual, dan Beban Mesin Cetak"
    >
      <SalesAnalyticsClient analytics={analytics} />
    </DashboardShell>
  );
}
