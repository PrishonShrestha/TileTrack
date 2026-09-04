import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { KitchenCalculator } from "@/features/calculator/components/KitchenCalculator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Kitchen calculator",
  description: "Combine countertop and backsplash with separate tile selections.",
};

export default function KitchenCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Kitchen calculator"
        description="Combine a countertop area (with sink cutout) and an optional backsplash. Each surface uses its own tile/marble."
      />
      <KitchenCalculator />
    </div>
  );
}

function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
