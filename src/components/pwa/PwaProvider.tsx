"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Wifi, WifiOff, Download, X } from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaContextType {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  isIOS: boolean;
  promptInstall: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstalled: false,
  canInstall: false,
  isOnline: true,
  isIOS: false,
  promptInstall: async () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Connected to cloud catalog and stock data.", {
        icon: <Wifi className="h-4 w-4 text-primary" />,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You are offline. Calculators remain fully functional!", {
        icon: <WifiOff className="h-4 w-4 text-amber-500" />,
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iOS
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("tiletrack_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
      toast.success("TileTrack has been installed as an app!");
    });

    // Register Service Worker in production / supported environments
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "development") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  toast.info("A new version of TileTrack is available!", {
                    action: {
                      label: "Reload",
                      onClick: () => {
                        newWorker.postMessage({ type: "SKIP_WAITING" });
                        window.location.reload();
                      },
                    },
                  });
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("ServiceWorker registration failed:", err);
        });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        toast.info("To install on iOS: tap the Share button and select 'Add to Home Screen'.");
      }
      return;
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowBanner(false);
    }
  };

  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("tiletrack_pwa_dismissed", Date.now().toString());
  };

  return (
    <PwaContext.Provider
      value={{
        isInstalled,
        canInstall: !!deferredPrompt || (isIOS && !isInstalled),
        isOnline,
        isIOS,
        promptInstall,
      }}
    >
      {children}

      {/* Floating PWA Install Prompt Banner */}
      {showBanner && !isInstalled ? (
        <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6 md:right-6 md:left-auto">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3">
              <AppLogo size={40} className="rounded-xl shadow-xs shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Install TileTrack</p>
                <p className="text-xs text-muted-foreground">Fast, offline-ready tile calculator on your home screen.</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button size="sm" onClick={promptInstall} className="h-8 gap-1.5 text-xs font-semibold">
                <Download className="h-3.5 w-3.5" /> Install
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={dismissBanner}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss install banner"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </PwaContext.Provider>
  );
}
