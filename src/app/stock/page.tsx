import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockManagementView } from "@/features/stock/components/StockManagementView";

export const metadata: Metadata = {
  title: "Stock",
  description: "Track inventory, update stock, and view history.",
};

export default function StockPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock management</h1>
          <p className="text-sm text-muted-foreground">
            Update inventory, watch for low stock, and review history.
          </p>
        </div>
      </div>
      <StockManagementView />
    </div>
  );
}
