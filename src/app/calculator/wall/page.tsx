import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { WallCalculator } from "@/features/calculator/components/WallCalculator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Wall calculator",
  description: "Tile multiple walls with optional opening deductions.",
};

export default function WallCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Wall calculator"
        description="Add as many walls as you need. Deduct door and window openings for an accurate estimate."
      />
      <WallCalculator />
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
