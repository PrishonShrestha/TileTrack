"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockUpdateButton } from "@/features/stock/components/StockUpdateButton";
import { StockStatusIndicator } from "@/features/stock/components/StockStatusIndicator";
import { LENGTH_UNIT_LABELS } from "@/lib/constants-labels";
import { formatNumber, formatStockBoxesAndPieces } from "@/lib/utils";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import { Pencil, Trash2 } from "lucide-react";
import type { Product, Stock } from "@/types/domain";

interface ProductCardProps {
  product: Product;
  stock?: Stock;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ProductCard({ product, stock, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold leading-tight">{product.productName}</div>
            <div className="text-xs text-muted-foreground">
              {product.productId} · {product.brand}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="capitalize">
              {product.type}
            </Badge>
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Edit product"
                onClick={onEdit}
              >
                <Pencil className="h-3 w-3" />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Delete product"
                onClick={onDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Size</div>
            <div className="font-medium">
              {formatNumber(product.length)} × {formatNumber(product.width)}{" "}
              {LENGTH_UNIT_LABELS[product.sizeUnit]}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Pieces / box</div>
            <div className="font-medium">{formatNumber(product.piecesPerBox)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Brand</div>
            <div className="font-medium">{product.brand || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Color variant</div>
            <div className="font-medium">{product.colorVariant || "—"}</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Price per box</div>
            <div className="text-base font-semibold">{CURRENCY_SYMBOL} {formatNumber(product.pricePerBox, { maximumFractionDigits: 2 })}</div>
          </div>
          {stock ? <StockStatusIndicator status={stock.stockStatus} /> : null}
        </div>
        <div className="flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-xs text-muted-foreground">
            {stock ? `${formatStockBoxesAndPieces(stock.stockBoxes, product.piecesPerBox)} in stock` : "Stock data unavailable"}
          </span>
          <StockUpdateButton
            productId={product.productId}
            sku={product.productId}
            productName={product.productName}
            currentStock={stock?.stockBoxes ?? 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}