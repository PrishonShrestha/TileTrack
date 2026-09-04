import { NextResponse, type NextRequest } from "next/server";
import { fetchStock, updateStock } from "@/lib/googleSheets";
import { stockUpdateSchema } from "@/features/calculator/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stock = await fetchStock();
    return NextResponse.json({ stock });
  } catch (error) {
    console.error("[/api/sheets/stock] GET failed", error);
    return NextResponse.json(
      { error: "Failed to load stock" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = stockUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const result = await updateStock(parsed.data);
    if (!result) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ stock: result.stock, history: result.history });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update stock";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
