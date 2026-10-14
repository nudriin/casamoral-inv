import React from "react";
import { getProfitLossStatement } from "@/lib/services/reports-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ProfitLossClient } from "./profit-loss-client";

export const metadata = {
  title: "Laporan Laba Rugi | Casa Moral 3D Printing",
  description: "Laporan Laba Rugi Komprehensif (Pendapatan, HPP, Beban Tetap & Variabel, Laba Bersih) Casa Moral.",
};

export default async function ProfitLossPage() {
  const statement = await getProfitLossStatement();

  return (
    <DashboardShell
      title="Laporan Laba Rugi Operasional"
      subtitle="Analisis Pendapatan Usaha, HPP Terkunci, dan Laba Bersih Studio"
    >
      <ProfitLossClient statement={statement} />
    </DashboardShell>
  );
}
