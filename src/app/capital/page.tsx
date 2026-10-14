import { getCapitalPurchases, getAssets, getCapitalSummary } from "@/lib/services/capital-service";
import { CapitalClient } from "./capital-client";

export default async function CapitalPage() {
  const [purchases, assets, summary] = await Promise.all([
    getCapitalPurchases(),
    getAssets(),
    getCapitalSummary(),
  ]);

  return (
    <CapitalClient
      initialPurchases={purchases}
      initialAssets={assets}
      initialSummary={summary}
    />
  );
}
