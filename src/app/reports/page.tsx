import React from "react";
import {
  getProfitLossStatement,
  getCashFlowStatement,
  getSalesAnalytics,
} from "@/lib/services/reports-service";
import { getOrders } from "@/lib/services/orders-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReportsHubClient } from "./reports-hub-client";

export const metadata = {
  title: "Laporan & Analitik Finansial | Casa Moral 3D Printing",
  description: "Pusat Laporan Keuangan, Laba Rugi, Arus Kas, Analitik Produk, dan Ekspor Spreadsheet Casa Moral.",
};

export default async function ReportsPage() {
  const [pl, cashFlow, sales, orders] = await Promise.all([
    getProfitLossStatement(),
    getCashFlowStatement(),
    getSalesAnalytics(),
    getOrders(),
  ]);

  return (
    <DashboardShell
      title="Pusat Laporan & Analitik Bisnis"
      subtitle="Konsolidasi Finansial, Laba Rugi, Arus Kas, dan Ekspor Spreadsheet"
    >
      <ReportsHubClient pl={pl} cashFlow={cashFlow} sales={sales} orders={orders} />
    </DashboardShell>
  );
}
