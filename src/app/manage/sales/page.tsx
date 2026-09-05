import type { Metadata } from "next";
import { SalesView } from "@/features/sales/components/SalesView";
import { ManageSubNav } from "@/features/manage/components/ManageSubNav";

export const metadata: Metadata = {
  title: "Sales Report",
  description: "View and filter sales records, customer returns, and calculated transaction values.",
};

export default function ManageSalesPage() {
  return (
    <div className="space-y-6">
      <ManageSubNav />
      <div className="container mx-auto px-4">
        <SalesView />
      </div>
    </div>
  );
}
