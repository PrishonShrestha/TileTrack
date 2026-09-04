"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid3X3, Home, Package, Ruler, Sparkles, Bath, ChefHat, Square, WifiOff } from "lucide-react";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { usePwa } from "@/components/pwa/PwaProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calculator/floor", label: "Floor", icon: Square },
  { href: "/calculator/wall", label: "Wall", icon: Ruler },
  { href: "/calculator/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/calculator/bathroom", label: "Bathroom", icon: Bath },
  { href: "/catalog", label: "Catalog", icon: Grid3X3 },
  { href: "/stock", label: "Stock", icon: Package },
];

export function Navbar() {
  const pathname = usePathname();
  const { isOnline } = usePwa();

  return (
    <header className="sticky top-0 z-40 hidden w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base">{APP_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs gap-1 py-1">
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
          <PwaInstallButton size="sm" variant="outline" />
          <Link href="/catalog" className="hidden lg:inline-flex">
            <Button variant="outline" size="sm">
              <Grid3X3 className="h-4 w-4" /> Catalog
            </Button>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
