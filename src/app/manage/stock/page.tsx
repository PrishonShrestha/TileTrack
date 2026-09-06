import type { Metadata } from "next";
import { StockManagementView } from "@/features/stock/components/StockManagementView";

export const metadata: Metadata = {
  title: "Stock Management",
  description: "Track inventory levels, update stock, and review transaction history.",
};

export default function ManageStockPage() {
  return <StockManagementView />;
}
