"use client";

import React, { useEffect, useState } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "casamoral_pwa_prompt_dismissed_v1";

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        })
        .catch(() => {
          // Service worker registration failed (e.g. non-HTTPS dev environment)
        });
    }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIsStandalone(standalone);

    const ios =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs rounded-xl border border-amber-500/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-3.5 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            Install Aplikasi Casa Moral
          </p>
          {deferredPrompt ? (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Pasang di perangkat Anda untuk akses cepat seperti aplikasi native.
            </p>
          ) : (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Di iOS Safari, ketuk{" "}
              <Share className="inline w-3 h-3 mx-0.5 text-amber-600" /> lalu pilih{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-0.5">
                <PlusSquare className="w-3 h-3" /> Add to Home Screen
              </span>
              .
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup banner install"
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {deferredPrompt && (
        <div className="mt-2.5 flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="accent"
            onClick={() => void handleInstallClick()}
            className="h-7 text-[11px] gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Pasang App</span>
          </Button>
        </div>
      )}
    </div>
  );
}
