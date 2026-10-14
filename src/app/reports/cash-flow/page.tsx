import React from "react";
import { getCashFlowStatement } from "@/lib/services/reports-service";
import { CashFlowClient } from "./cash-flow-client";

export const metadata = {
  title: "Laporan Arus Kas | Casa Moral 3D Printing",
  description: "Laporan Arus Kas Metode Langsung (Kas Masuk Operasi, Keluar Beban, Investasi Mesin, dan Saldo Kas).",
};

export default async function CashFlowPage() {
  const statement = await getCashFlowStatement();

  return (
    <CashFlowClient statement={statement} />
  );
}
