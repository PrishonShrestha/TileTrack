import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { Product, Stock } from "@/types/domain";
import { lengthToMm } from "@/features/calculator/lib/unitConversion";

const selectCatalogState = (state: RootState) => state.catalog;

export const selectCatalogFilters = createSelector(selectCatalogState, (catalog) => ({
  search: catalog.search,
  types: catalog.types,
  brands: catalog.brands,
  colorVariants: catalog.colorVariants,
  minPrice: catalog.minPrice,
  maxPrice: catalog.maxPrice,
}));

export const selectIsFiltersOpen = (state: RootState) => state.catalog.isFiltersOpen;

export const makeSelectFilteredProducts = (
  products: Product[] | undefined,
  stock: Stock[] | undefined
) =>
  createSelector(
    [selectCatalogFilters, (state: RootState) => state],
    (filters) => {
      if (!products) return [];
      const stockById = new Map<string, Stock>();
      (stock ?? []).forEach((s) => stockById.set(s.productId, s));
      const search = filters.search.trim().toLowerCase();
      return products.filter((product) => {
        if (search) {
          const haystack = [product.productName, product.productId, product.colorVariant, product.brand]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        if (filters.types.length && !filters.types.includes(product.type)) return false;
        if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
        if (filters.colorVariants.length && !filters.colorVariants.includes(product.colorVariant)) return false;
        if (filters.minPrice !== null && product.pricePerBox < filters.minPrice) return false;
        if (filters.maxPrice !== null && product.pricePerBox > filters.maxPrice) return false;
        return true;
      });
    }
  );

export const selectStockBySku = (stock: Stock[] | undefined) => {
  if (!stock) return new Map<string, Stock>();
  const map = new Map<string, Stock>();
  for (const item of stock) {
    map.set(item.productId, item);
  }
  return map;
};
