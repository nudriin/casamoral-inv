import React from "react";
import Link from "next/link";
import { getOrderById } from "@/lib/services/orders-service";
import { getProducts } from "@/lib/services/products-service";
import { OrderDetailClient } from "./order-detail-client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShoppingCart } from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);
  return {
    title: order ? `Detail Pesanan ${order.order_number} | Casa Moral` : "Pesanan Tidak Ditemukan",
    description: "Detail pesanan, kustomisasi variasi warna, snapshot HPP, dan alur produksi.",
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const [order, products] = await Promise.all([
    getOrderById(id),
    getProducts(false),
  ]);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-700" />
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="text-xs text-zinc-500">
          Pesanan dengan nomor atau ID &quot;{id}&quot; tidak dapat ditemukan di sistem.
        </p>
        <Link href="/orders">
          <Button variant="outline" size="sm" className="gap-1 mt-2">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pesanan
          </Button>
        </Link>
      </div>
    );
  }

  return <OrderDetailClient initialOrder={order} products={products} />;
}
