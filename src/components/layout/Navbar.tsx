"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Ruler,
  Sparkles,
  Bath,
  ChefHat,
  Square,
  WifiOff,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { usePwa } from "@/components/pwa/PwaProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/features/auth/store/authApi";
import { toast } from "sonner";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/calculator/floor", label: "Floor", icon: Square },
  { href: "/calculator/wall", label: "Wall", icon: Ruler },
  { href: "/calculator/kitchen", label: "Kitchen", icon: ChefHat },
  { href: "/calculator/bathroom", label: "Bathroom", icon: Bath },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline } = usePwa();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out successfully.");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out.");
    }
  };

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
          {PUBLIC_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
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

          {isAuthenticated ? (
            <Link
              href="/manage"
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/manage")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-primary hover:bg-primary/10"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Manage
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {!isOnline && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-xs gap-1 py-1"
            >
              <WifiOff className="h-3 w-3" /> Offline
            </Badge>
          )}
          <PwaInstallButton size="sm" variant="outline" />

          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          ) : null}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
