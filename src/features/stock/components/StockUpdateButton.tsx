"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StockUpdateForm } from "./StockUpdateForm";

interface StockUpdateButtonProps {
  productId?: string;
  sku?: string;
  productName?: string;
  currentStock: number;
  label?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function StockUpdateButton({
  productId,
  sku,
  productName,
  currentStock,
  label = "Update",
  variant = "outline",
  size = "sm",
}: StockUpdateButtonProps) {
  const [open, setOpen] = useState(false);
  const targetId = productId || sku || "";
  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {label}
      </Button>
      <StockUpdateForm
        productId={targetId}
        sku={targetId}
        productName={productName}
        currentStock={currentStock}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
