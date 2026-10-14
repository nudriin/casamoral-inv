import Link from "next/link";
import { ArrowLeft, Home, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Halaman Tidak Ditemukan (404)</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Halaman atau tautan yang Anda tuju tidak tersedia atau telah dipindahkan dalam sistem manajemen Casa Moral.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/">
            <Button size="sm" className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold text-xs gap-1.5">
              <Home className="w-3.5 h-3.5" /> Dashboard Utama
            </Button>
          </Link>
          <Link href="/orders">
            <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" /> Kelola Pesanan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
