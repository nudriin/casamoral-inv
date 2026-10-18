import React from "react";
import { getFinancialRecap } from "@/lib/services/recap-service";
import { RecapClient } from "./recap-client";

export const metadata = {
  title: "Rekap Pencatatan Keuangan & Transaksi | Casa Moral 3D Printing",
  description: "Rekapitulasi pencatatan keuangan bisnis, omzet penjualan kotor, rincian modal produk & kemasan, potongan fee Shopee, dan pendapatan bersih.",
};

export default async function FinancialRecapPage() {
  const recap = await getFinancialRecap({ period: "ALL" });

  return <RecapClient initialRecap={recap} />;
}
