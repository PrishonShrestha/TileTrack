import { NextResponse, type NextRequest } from "next/server";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/googleSheets";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
} from "@/features/calculator/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error("[/api/sheets/products] GET failed", error);
    return NextResponse.json(
      { error: "Failed to load products" },
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

  const parsed = createProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = updateProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product update data", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const product = await updateProduct(parsed.data);
    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  let productId = request.nextUrl.searchParams.get("productId");
  if (!productId) {
    try {
      const body = (await request.json()) as { productId?: string };
      productId = body.productId ?? null;
    } catch {
      // Ignored if not JSON body
    }
  }

  const parsed = deleteProductSchema.safeParse({ productId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Product ID is required for deletion" },
      { status: 400 }
    );
  }

  try {
    const result = await deleteProduct(parsed.data.productId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}
