"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLogo } from "@/components/layout/AppLogo";
import {
  Sparkles,
  Calculator as CalcIcon,
  Grid3X3,
  Package,
  ArrowRight,
  ChefHat,
  Bath,
  Ruler,
  Square,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/features/calculator/components/UnitToggle";
import { useAppSelector } from "@/store/hooks";

const calculators = [
  {
    href: "/calculator/floor",
    title: "Floor calculator",
    description: "Estimate tiles, boxes, and cost for a rectangular room.",
    icon: Square,
    accent: "from-primary/15 to-primary/5",
  },
  {
    href: "/calculator/wall",
    title: "Wall calculator",
    description:
      "Tile multiple walls with opening deductions (doors, windows).",
    icon: Ruler,
    accent: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    href: "/calculator/kitchen",
    title: "Kitchen calculator",
    description:
      "Combine countertop and optional backsplash with per-surface tiles.",
    icon: ChefHat,
    accent: "from-amber-500/15 to-amber-500/5",
  },
  {
    href: "/calculator/bathroom",
    title: "Bathroom calculator",
    description: "Floor + walls together with separate tile picks for each.",
    icon: Bath,
    accent: "from-sky-500/15 to-sky-500/5",
  },
];

const supportLinks = [
  {
    href: "/manage/catalog",
    title: "Product catalog",
    description: "Browse and search the full tile and marble catalog.",
    icon: Grid3X3,
  },
  {
    href: "/manage/stock",
    title: "Stock management",
    description: "Track box counts, set minimums, view history.",
    icon: Package,
  },
];

export function HomeDashboard() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/manage");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <AppLogo size={18} className="rounded-md border-0 p-0 shadow-none bg-transparent" />
              TileTrack
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Plan your next tile project with confidence
            </h1>
            <p className="text-base text-muted-foreground">
              Live product catalog, wastage buffers, multi-wall &amp;
              multi-surface calculations, and stock tracking — all in one place.
              Powered by your Google Sheet.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="lg">
                <Link href="/calculator/floor">
                  <CalcIcon className="h-4 w-4" /> Start a floor calc
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/manage/catalog">Browse catalog</Link>
              </Button>
            </div>
          </div>
          <div className="hidden md:block">
            <UnitToggle />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <header className="flex items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Calculators
            </h2>
            <p className="text-sm text-muted-foreground">
              Pick a calculator to get started — your inputs are saved per
              section.
            </p>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {calculators.map((calc) => {
            const Icon = calc.icon;
            return (
              <Card key={calc.href} className="group relative overflow-hidden">
                <div
                  className={`absolute inset-0 -z-10 bg-gradient-to-br ${calc.accent} opacity-70`}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <CardTitle className="mt-3 text-base">{calc.title}</CardTitle>
                  <CardDescription>{calc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href={calc.href}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {supportLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.href}>
              <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-secondary text-secondary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" size="sm">
                  <Link href={link.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
