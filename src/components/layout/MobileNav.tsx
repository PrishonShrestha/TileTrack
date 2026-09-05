"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bath,
  ChefHat,
  Download,
  Home,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Ruler,
  Square,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePwa } from "@/components/pwa/PwaProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/features/auth/store/authApi";
import { toast } from "sonner";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isInstalled, isOnline, promptInstall } = usePwa();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [logout] = useLogoutMutation();

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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      {!isOnline && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-500/15 py-1 text-[11px] font-medium text-amber-500 border-b border-amber-500/20">
          <WifiOff className="h-3 w-3" /> Offline mode — Calculators available
        </div>
      )}
      <div className={cn("grid", isAuthenticated ? "grid-cols-5" : "grid-cols-4")}>
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-5 w-5" />
          Home
        </Link>

        <Link
          href="/calculator/floor"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            pathname.startsWith("/calculator/floor") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Square className="h-5 w-5" />
          Floor
        </Link>

        <Link
          href="/calculator/wall"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            pathname.startsWith("/calculator/wall") ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Ruler className="h-5 w-5" />
          Wall
        </Link>

        {isAuthenticated ? (
          <Link
            href="/manage"
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition-colors",
              pathname.startsWith("/manage") ? "text-primary" : "text-primary/70 hover:text-primary"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Manage
          </Link>
        ) : null}

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
          <DropdownMenuContent align="end" side="top" className="bottom-16 w-48">
            <DropdownMenuItem
              asChild
              className={cn(
                pathname.startsWith("/calculator/kitchen") ? "bg-primary text-primary-foreground" : "",
                "flex items-center gap-2 py-2"
              )}
            >
              <Link href="/calculator/kitchen" className="flex items-center gap-2 w-full">
                <ChefHat className="h-4 w-4" />
                Kitchen Calc
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              asChild
              className={cn(
                pathname.startsWith("/calculator/bathroom") ? "bg-primary text-primary-foreground" : "",
                "flex items-center gap-2 py-2"
              )}
            >
              <Link href="/calculator/bathroom" className="flex items-center gap-2 w-full">
                <Bath className="h-4 w-4" />
                Bathroom Calc
              </Link>
            </DropdownMenuItem>

            {isAuthenticated ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 py-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : null}

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