import { NextResponse } from "next/server";
import { fetchItemCategories } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const itemCategories = await fetchItemCategories();
    return NextResponse.json({ itemCategories });
  } catch (error) {
    console.error("[/api/sheets/item-categories] GET failed", error);
    return NextResponse.json({ error: "Failed to load item categories" }, { status: 500 });
  }
}
