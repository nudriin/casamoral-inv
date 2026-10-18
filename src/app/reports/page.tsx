import React from "react";
import {
  getProfitLossStatement,
  getCashFlowStatement,
  getSalesAnalytics,
} from "@/lib/services/reports-service";
import { getOrders } from "@/lib/services/orders-service";
import { getFinancialRecap } from "@/lib/services/recap-service";
import { ReportsHubClient } from "./reports-hub-client";

export const metadata = {
  title: "Pusat Laporan & Buku Kas Terpadu | Casa Moral 3D Printing",
  description: "Buku Kas harian, Rekap Omzet & Laba Bersih, Laba Rugi SAK EMKM, Arus Kas, dan Ekspor Spreadsheet Casa Moral.",
};

export default async function ReportsPage() {
  const [pl, cashFlow, sales, orders, recap] = await Promise.all([
    getProfitLossStatement(),
    getCashFlowStatement(),
    getSalesAnalytics(),
    getOrders(),
    getFinancialRecap({ period: "ALL" }),
  ]);

  return (
    <ReportsHubClient
      pl={pl}
      cashFlow={cashFlow}
      sales={sales}
      orders={orders}
      recap={recap}
    />
  );
}
