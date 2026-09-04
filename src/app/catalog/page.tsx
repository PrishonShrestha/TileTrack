import type { Metadata } from "next";
import { CatalogView } from "@/features/catalog/components/CatalogView";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse and search the live product catalog.",
};

export default function CatalogPage() {
  return <CatalogView />;
}
