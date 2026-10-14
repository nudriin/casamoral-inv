import React from "react";
import {
  getProfitLossStatement,
  getCashFlowStatement,
  getSalesAnalytics,
} from "@/lib/services/reports-service";
import { getOrders } from "@/lib/services/orders-service";
import { ReportsHubClient } from "./reports-hub-client";

export const metadata = {
  title: "Pusat Laporan & Analitik Finansial | Casa Moral 3D Printing",
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
    <ReportsHubClient pl={pl} cashFlow={cashFlow} sales={sales} orders={orders} />
  );
}
