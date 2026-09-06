import type { Metadata } from "next";
import { CatalogView } from "@/features/catalog/components/CatalogView";

export const metadata: Metadata = {
  title: "Catalog Management",
  description: "Browse, search, add, edit, and delete catalog products.",
};

export default function ManageCatalogPage() {
  return <CatalogView />;
}
