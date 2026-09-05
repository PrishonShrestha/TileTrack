import type { Metadata } from "next";
import { ManageDashboardView } from "@/features/manage/components/ManageDashboardView";
import { ManageSubNav } from "@/features/manage/components/ManageSubNav";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Overview of sales, inventory movements, restocks, and catalog status.",
};

export default function ManageDashboardPage() {
  return (
    <div className="space-y-6">
      <ManageSubNav />
      <div className="container mx-auto px-4">
        <ManageDashboardView />
      </div>
    </div>
  );
}
