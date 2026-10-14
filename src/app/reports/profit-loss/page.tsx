import React from "react";
import { getProfitLossStatement } from "@/lib/services/reports-service";
import { ProfitLossClient } from "./profit-loss-client";

export const metadata = {
  title: "Laporan Laba Rugi | Casa Moral 3D Printing",
  description: "Laporan Laba Rugi Komprehensif (Pendapatan, HPP, Beban Tetap & Variabel, Laba Bersih) Casa Moral.",
};

export default async function ProfitLossPage() {
  const statement = await getProfitLossStatement();

  return (
    <ProfitLossClient statement={statement} />
  );
}
