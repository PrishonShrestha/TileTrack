import type { Metadata } from "next";
import { StockManagementView } from "@/features/stock/components/StockManagementView";
import { ManageSubNav } from "@/features/manage/components/ManageSubNav";

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Track inventory levels, update stock, and review transaction history.",
};

export default function ManageStockPage() {
  return (
    <div className="space-y-6">
      <ManageSubNav />
      <div className="container mx-auto px-4">
        <StockManagementView />
      </div>
    </div>
  );
}
