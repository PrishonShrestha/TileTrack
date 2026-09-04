import { NextResponse } from "next/server";
import { fetchColorVariants } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const colorVariants = await fetchColorVariants();
    return NextResponse.json({ colorVariants });
  } catch (error) {
    console.error("[/api/sheets/color-variants] failed", error);
    return NextResponse.json(
      { error: "Failed to load color variants" },
      { status: 500 }
    );
  }
}
