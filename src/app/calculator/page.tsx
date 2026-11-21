import React from "react";
import { ElsCalculatorClient } from "./els-calculator-client";
import { getCapitalSummary } from "@/lib/services/capital-service";

export const metadata = {
  title: "Kalkulator HPP & Penetapan Harga | Casa Moral 3D Printing",
  description:
    "Kalkulator HPP lengkap Casa Moral untuk penetapan model, harga filamen, printer, listrik PLN, aksesoris, kemasan, overhead, dan target profit.",
};

export default async function CalculatorPage() {
  const capitalSummary = await getCapitalSummary();
  return <ElsCalculatorClient initialTotalCapital={capitalSummary.totalCapital} />;
}
