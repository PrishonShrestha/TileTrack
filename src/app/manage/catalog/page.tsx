import type { Metadata } from "next";
import { CatalogView } from "@/features/catalog/components/CatalogView";
import { ManageSubNav } from "@/features/manage/components/ManageSubNav";

export const metadata: Metadata = {
  title: "Catalog Management",
  description: "Browse, search, add, edit, and delete catalog products.",
};

export default function ManageCatalogPage() {
  return (
    <div className="space-y-6">
      <ManageSubNav />
      <div className="container mx-auto px-4">
        <CatalogView />
      </div>
    </div>
  );
}
