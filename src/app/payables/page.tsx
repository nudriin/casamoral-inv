import React from "react";
import { getPayables, getPayablesSummary } from "@/lib/services/payables-service";
import { PayablesClient } from "./payables-client";

export const metadata = {
  title: "Utang Usaha & Cicilan Aset | Casa Moral 3D Printing",
  description: "Manajemen utang bisnis, jadwal cicilan Shopee PayLater mesin Anycubic Kobra X, dan pemisahan arus kas keluar pembiayaan.",
};

export default async function PayablesPage() {
  const [payables, summary] = await Promise.all([
    getPayables(),
    getPayablesSummary(),
  ]);

  return <PayablesClient initialPayables={payables} summary={summary} />;
}
