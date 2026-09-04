import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BathroomCalculator } from "@/features/calculator/components/BathroomCalculator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bathroom calculator",
  description: "Combine bathroom floor and walls with separate tile selections.",
};

export default function BathroomCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bathroom calculator"
        description="Combine the floor and all walls of a bathroom in one place, with a clear breakdown for each surface."
      />
      <BathroomCalculator />
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
