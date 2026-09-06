import type { Metadata } from "next";
import { ItemsView } from "@/features/items/components/ItemsView";

export const metadata: Metadata = {
  title: "Items Management",
  description: "Browse, search, add, edit, and delete non-tile store items.",
};

export default function ManageItemsPage() {
  return <ItemsView />;
}
