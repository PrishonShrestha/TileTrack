"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Ruler,
  Bath,
  ChefHat,
  Square,
  WifiOff,
  LayoutDashboard,
  LogOut,
  LogIn,
  BookOpen,
  Boxes,
  Package,
  ShoppingCart,
  Calculator,
  ChevronDown,
} from "lucide-react";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/features/theme/components/ThemeToggle";
import { PwaInstallButton } from "@/components/pwa/PwaInstallButton";
import { usePwa } from "@/components/pwa/PwaProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

const SIGNED_IN_NAV_ITEMS = [
  { href: "/manage", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/manage/catalog", label: "Catalog", icon: BookOpen, exact: false },
  { href: "/manage/stock", label: "Stock", icon: Boxes, exact: false },
  { href: "/manage/sales", label: "Sales", icon: ShoppingCart, exact: false },
];

const CALCULATOR_ITEMS = [
  { href: "/calculator/floor", label: "Floor Calculator", icon: Square },
  { href: "/calculator/wall", label: "Wall Calculator", icon: Ruler },
  { href: "/calculator/kitchen", label: "Kitchen Calculator", icon: ChefHat },
  { href: "/calculator/bathroom", label: "Bathroom Calculator", icon: Bath },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline } = usePwa();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out successfully.");
      setLogoutConfirmOpen(false);
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out.");
    }
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden">
        <Link href={isAuthenticated ? "/manage" : "/"} className="flex items-center gap-2 font-semibold">
          <AppLogo size={28} />
          <span className="text-sm font-bold tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {!isOnline && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] gap-1 py-0.5 px-1.5"
            >
              <WifiOff className="h-2.5 w-2.5" /> Offline
            </Badge>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <Link href={isAuthenticated ? "/manage" : "/"} className="flex items-center gap-2.5 font-semibold">
            <AppLogo size={34} priority />
            <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          <nav className="flex items-center gap-1">
            {isAuthenticated ? (
              <>
                {SIGNED_IN_NAV_ITEMS.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all cursor-pointer",
                        pathname.startsWith("/calculator")
                          ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <Calculator className="h-4 w-4" />
                      <span>Calculations</span>
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 shadow-md">
                    {CALCULATOR_ITEMS.map((calc) => {
                      const Icon = calc.icon;
                      const isActive = pathname.startsWith(calc.href);
                      return (
                        <DropdownMenuItem key={calc.href} asChild className="py-2 cursor-pointer">
                          <Link
                            href={calc.href}
                            className={cn(
                              "flex items-center gap-2 w-full",
                              isActive ? "text-primary font-semibold bg-primary/5" : ""
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {calc.label}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              PUBLIC_NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })
            )}
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
                onClick={() => setLogoutConfirmOpen(true)}
                disabled={isLoggingOut}
                className="text-muted-foreground hover:text-destructive gap-1.5"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline">Logout</span>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href="/login">
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </Link>
              </Button>
            )}

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Logout confirmation dialog */}
      <Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              <DialogTitle>Log Out</DialogTitle>
            </div>
            <DialogDescription className="pt-1 text-sm text-foreground">
              Are you sure you want to log out of your session?
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            You will need to sign in again to access the management portal.
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setLogoutConfirmOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="gap-1.5"
            >
              {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
