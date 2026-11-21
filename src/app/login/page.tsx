"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function PinLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";

  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submitPin = async (pinValue: string) => {
    if (pinValue.length !== 6 || loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        const safeNext = nextPath.startsWith("/") ? nextPath : "/";
        router.replace(safeNext);
        router.refresh();
      } else {
        setErrorMsg(data.error || "PIN tidak valid.");
        setPin("");
        inputRef.current?.focus();
        setLoading(false);
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(cleaned);
    setErrorMsg(null);
    if (cleaned.length === 6) {
      void submitPin(cleaned);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-sm border-zinc-200 dark:border-zinc-800 shadow-lg">
        <CardHeader className="text-center space-y-2 pb-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <CardTitle className="text-lg font-bold tracking-tight">
            Casa Moral Studio
          </CardTitle>
          <CardDescription className="text-xs">
            Masukkan 6-digit PIN akses untuk membuka sistem manajemen bisnis.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 6-Digit Visual Indicator with Transparent Native Input Overlay (for mobile & desktop keyboard) */}
          <div className="space-y-2">
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={pin}
                disabled={loading}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pin.length === 6) {
                    void submitPin(pin);
                  }
                }}
                aria-label="Masukkan 6-digit PIN"
                className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-text"
              />
              <div className="grid grid-cols-6 gap-2 pointer-events-none">
                {[0, 1, 2, 3, 4, 5].map((idx) => {
                  const char = pin[idx] || "";
                  const isActive = pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`h-12 rounded-xl border flex items-center justify-center text-lg font-mono font-bold transition-all ${
                        isActive
                          ? "border-amber-500 ring-2 ring-amber-500/20 bg-white dark:bg-zinc-900"
                          : char
                          ? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                          : "border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/40"
                      }`}
                    >
                      {char ? (showPin ? char : "•") : ""}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-zinc-400">Ketuk kotak di atas untuk ketik PIN</span>
              <div className="flex items-center gap-3">
                {pin.length > 0 && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setPin("");
                      setErrorMsg(null);
                      inputRef.current?.focus();
                    }}
                    className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowPin((s) => !s);
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? "Sembunyikan" : "Tampilkan"}</span>
                </button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="accent"
            disabled={loading || pin.length !== 6}
            onClick={() => void submitPin(pin)}
            className="w-full h-10 text-xs font-semibold gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi PIN...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk ke Studio</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950" />}>
      <PinLoginForm />
    </Suspense>
  );
}
