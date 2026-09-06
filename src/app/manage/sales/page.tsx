import type { Metadata } from "next";
import { SalesView } from "@/features/sales/components/SalesView";

export const metadata: Metadata = {
  title: "Sales Report",
  description: "View and filter sales records, customer returns, and calculated transaction values.",
};

export default function ManageSalesPage() {
  return <SalesView />;
}
