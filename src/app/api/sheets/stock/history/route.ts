import { NextResponse, type NextRequest } from "next/server";
import { fetchStockHistory } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("productId") ?? request.nextUrl.searchParams.get("sku") ?? undefined;
    const history = await fetchStockHistory();
    const filtered = id ? history.filter((entry) => entry.productId === id || entry.sku === id) : history;
    return NextResponse.json({ history: filtered });
  } catch (error) {
    console.error("[/api/sheets/stock/history] failed", error);
    return NextResponse.json(
      { error: "Failed to load stock history" },
      { status: 500 }
    );
  }
}
