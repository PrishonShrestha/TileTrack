import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FloorCalculator } from "@/features/calculator/components/FloorCalculator";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Floor calculator",
  description: "Estimate tile and box requirements for a rectangular floor.",
};

export default function FloorCalculatorPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Floor calculator"
        description="Enter your room dimensions and pick a tile to estimate the total tiles, boxes, and cost."
      />
      <FloorCalculator />
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
