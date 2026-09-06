"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bath,
  ChefHat,
  Download,
  Home,
  LayoutDashboard,
  BookOpen,
  Package,
  Boxes,
  ShoppingCart,
  LogOut,
  LogIn,
  MoreHorizontal,
  Ruler,
  Square,
  WifiOff,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { usePwa } from "@/components/pwa/PwaProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/features/auth/store/authApi";
import { toast } from "sonner";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isInstalled, isOnline, promptInstall } = usePwa();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

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
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden">
        {!isOnline && (
          <div className="flex items-center justify-center gap-1.5 bg-amber-500/15 py-1 text-[11px] font-medium text-amber-500 border-b border-amber-500/20">
            <WifiOff className="h-3 w-3" /> Offline mode — Calculators available
          </div>
        )}

        {isAuthenticated ? (
          /* Logged In: Manage navigation + More (Calculators & Logout) */
          <div className="grid grid-cols-5">
            <Link
              href="/manage"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname === "/manage" ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dash</span>
            </Link>

            <Link
              href="/manage/catalog"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname.startsWith("/manage/catalog") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="h-4.5 w-4.5" />
              <span>Catalog</span>
            </Link>

            <Link
              href="/manage/stock"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname.startsWith("/manage/stock") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Boxes className="h-4.5 w-4.5" />
              <span>Stock</span>
            </Link>

            <Link
              href="/manage/sales"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname.startsWith("/manage/sales") ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              <span>Sales</span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                    pathname.startsWith("/calculator") || pathname === "/"
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <MoreHorizontal className="h-4.5 w-4.5" />
                  <span>More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="bottom-16 w-52">
                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/floor" className="flex items-center gap-2 w-full">
                    <Square className="h-4 w-4" />
                    Floor Calculator
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/wall" className="flex items-center gap-2 w-full">
                    <Ruler className="h-4 w-4" />
                    Wall Calculator
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/kitchen" className="flex items-center gap-2 w-full">
                    <ChefHat className="h-4 w-4" />
                    Kitchen Calculator
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/bathroom" className="flex items-center gap-2 w-full">
                    <Bath className="h-4 w-4" />
                    Bathroom Calculator
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex items-center gap-2 py-2 cursor-pointer"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </DropdownMenuItem>

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

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLogoutConfirmOpen(true)}
                  className="flex items-center gap-2 py-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          /* Logged Out: Calculators + More (Kitchen/Bath, Sign In) */
          <div className="grid grid-cols-4">
            <Link
              href="/"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/calculator/floor"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname.startsWith("/calculator/floor") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Square className="h-5 w-5" />
              <span>Floor</span>
            </Link>

            <Link
              href="/calculator/wall"
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                pathname.startsWith("/calculator/wall") ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Ruler className="h-5 w-5" />
              <span>Wall</span>
            </Link>

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
              <DropdownMenuContent align="end" side="top" className="bottom-16 w-52">
                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/kitchen" className="flex items-center gap-2 w-full">
                    <ChefHat className="h-4 w-4" />
                    Kitchen Calc
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="flex items-center gap-2 py-2">
                  <Link href="/calculator/bathroom" className="flex items-center gap-2 w-full">
                    <Bath className="h-4 w-4" />
                    Bathroom Calc
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  className="flex items-center gap-2 py-2 cursor-pointer"
                >
                  {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-500" />}
                  <span>{isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  asChild
                  className="flex items-center gap-2 py-2 text-primary font-medium cursor-pointer"
                >
                  <Link href="/login" className="flex items-center gap-2 w-full">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                </DropdownMenuItem>

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
        )}
      </nav>

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