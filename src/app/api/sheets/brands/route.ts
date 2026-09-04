import { NextResponse } from "next/server";
import { fetchBrands } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = await fetchBrands();
    return NextResponse.json({ brands });
  } catch (error) {
    console.error("[/api/sheets/brands] failed", error);
    return NextResponse.json(
      { error: "Failed to load brands" },
      { status: 500 }
    );
  }
}
