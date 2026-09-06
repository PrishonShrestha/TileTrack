import type { Metadata } from "next";
import { ManageDashboardView } from "@/features/manage/components/ManageDashboardView";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Overview of sales, inventory movements, restocks, and catalog status.",
};

export default function ManageDashboardPage() {
  return <ManageDashboardView />;
}
