"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Package, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/manage",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Catalog",
    href: "/manage/catalog",
    icon: BookOpen,
    exact: false,
  },
  {
    label: "Stock",
    href: "/manage/stock",
    icon: Package,
    exact: false,
  },
  {
    label: "Sales",
    href: "/manage/sales",
    icon: ShoppingCart,
    exact: false,
  },
];

export function ManageSubNav() {
  const pathname = usePathname();

  return (
    <div className="border-b bg-card/60 backdrop-blur-sm sticky top-14 z-20">
      <div className="container mx-auto flex items-center justify-between px-4">
        <nav className="flex items-center space-x-1 overflow-x-auto py-2.5 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
