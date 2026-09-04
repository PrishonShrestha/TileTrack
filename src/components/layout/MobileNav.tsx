"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bath,
  Calculator as CalcIcon,
  ChefHat,
  Download,
  Grid3X3,
  Home,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Ruler,
  Square,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwa } from "@/components/pwa/PwaProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const MAIN_NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calculator/floor", label: "Floor", icon: Square },
  { href: "/calculator/wall", label: "Wall", icon: Ruler },
  { href: "/catalog", label: "Catalog", icon: Grid3X3 },
];

const MORE_NAV = [
  { href: "/calculator/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/calculator/bathroom", label: "Bathroom", icon: Bath },
  { href: "/stock", label: "Stock", icon: Package },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isInstalled, isOnline, promptInstall } = usePwa();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {!isOnline && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-500/15 py-1 text-[11px] font-medium text-amber-500 border-b border-amber-500/20">
          <WifiOff className="h-3 w-3" /> Offline mode — Calculators available
        </div>
      )}
      <div className="grid grid-cols-5">
        {MAIN_NAV.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                "text-muted-foreground hover:text-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="bottom-16 w-44">
            {MORE_NAV.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className={cn(
                    isActive ? "bg-primary text-primary-foreground" : "",
                    "flex items-center gap-2 py-2"
                  )}
                >
                  <Link href={item.href} className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
            {!isInstalled && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => promptInstall()}
                  className="flex items-center gap-2 py-2 text-primary font-medium cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  Install App
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}