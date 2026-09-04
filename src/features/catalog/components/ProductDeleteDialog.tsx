"use client";

import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/domain";
import { useDeleteProductMutation } from "@/features/catalog/store/catalogApi";

interface ProductDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ProductDeleteDialog({
  open,
  onOpenChange,
  product,
}: ProductDeleteDialogProps) {
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();

  if (!product) return null;

  const handleDelete = async () => {
    try {
      await deleteProduct({ productId: product.productId }).unwrap();
      toast.success(`Product "${product.productName}" deleted successfully`);
      onOpenChange(false);
    } catch (error: unknown) {
      const apiErr = error as { data?: { error?: string }; message?: string };
      const message =
        apiErr?.data?.error || apiErr?.message || "Failed to delete product";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Delete Product</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-foreground">
            Are you sure you want to delete <strong>{product.productName}</strong> (
            <span className="font-mono text-xs font-semibold">{product.productId}</span>)?
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          This will permanently remove this item from your Products catalog and Stock table in Google Sheets. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Yes, Delete Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
