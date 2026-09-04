import { NextResponse } from "next/server";
import { fetchTypes } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const types = await fetchTypes();
    return NextResponse.json({ types });
  } catch (error) {
    console.error("[/api/sheets/types] failed", error);
    return NextResponse.json(
      { error: "Failed to load types" },
      { status: 500 }
    );
  }
}
