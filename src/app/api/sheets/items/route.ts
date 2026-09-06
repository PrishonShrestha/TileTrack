import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { fetchItems, createItem, updateItem, deleteItem } from "@/lib/googleSheets";

export const dynamic = "force-dynamic";

const createItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.number().min(0, "Price must be non-negative"),
  initialStockQty: z.number().min(0).optional(),
  minStock: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const updateItemSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required"),
  unit: z.string().min(1, "Unit is required"),
  pricePerUnit: z.number().min(0, "Price must be non-negative"),
  minStock: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const items = await fetchItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("[/api/sheets/items] GET failed", error);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid item data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const item = await createItem(parsed.data);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid item update data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const item = await updateItem(parsed.data);
    return NextResponse.json({ item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  let itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) {
    try {
      const body = (await request.json()) as { itemId?: string };
      itemId = body.itemId ?? null;
    } catch {
      // Ignored if not JSON body
    }
  }

  if (!itemId) {
    return NextResponse.json({ error: "Item ID is required for deletion" }, { status: 400 });
  }

  try {
    const result = await deleteItem(itemId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete item";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
