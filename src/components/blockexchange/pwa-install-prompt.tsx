"use client";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "./pwa-icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [platform] = useState<"android" | "ios" | "other">(() => {
    if (typeof navigator === "undefined") return "other";
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
    if (/android/.test(ua)) return "android";
    return "other";
  });

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;
    if (isStandalone) return;
    if (sessionStorage.getItem("bx-pwa-dismissed")) return;
    const onBIP = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); setTimeout(() => setShowBanner(true), 3000); };
    window.addEventListener("beforeinstallprompt", onBIP);
    if (platform === "ios") { const t = setTimeout(() => setShowBanner(true), 4000); return () => { clearTimeout(t); window.removeEventListener("beforeinstallprompt", onBIP); }; }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, [platform]);

  const dismiss = useCallback(() => { setShowBanner(false); sessionStorage.setItem("bx-pwa-dismissed", "1"); }, []);
  const install = useCallback(async () => {
    if (deferredPrompt) { await deferredPrompt.prompt(); const c = await deferredPrompt.userChoice; if (c.outcome === "accepted") setShowBanner(false); setDeferredPrompt(null); }
  }, [deferredPrompt]);

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
          <div className="bx-glass rounded-2xl p-5 bx-glow relative">
            <button onClick={dismiss} className="absolute top-3 right-3 p-1 rounded-lg text-muted-foreground hover:text-white" aria-label="Dismiss"><X className="w-4 h-4" /></button>
            <div className="flex items-start gap-3 pr-6">
              <div className="w-11 h-11 rounded-xl bx-blue-gradient flex items-center justify-center shrink-0"><Download className="w-5 h-5 text-white" /></div>
              <div><h3 className="text-sm font-bold text-white">Install BlockExchange App</h3><p className="text-xs text-muted-foreground mt-0.5">{platform === "ios" ? "Add to Home Screen for a native app experience." : "Install on your device for fast access."}</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={install} className="flex-1 h-9 rounded-lg bx-blue-gradient text-white text-sm font-medium flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> Install now</button>
              <button onClick={dismiss} className="px-4 h-9 rounded-lg bg-white/5 text-muted-foreground text-sm">Later</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
