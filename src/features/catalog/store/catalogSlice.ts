import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CatalogFilters } from "@/types/domain";

export interface CatalogState extends CatalogFilters {
  isFiltersOpen: boolean;
}

const initialState: CatalogState = {
  search: "",
  types: [],
  brands: [],
  colorVariants: [],
  minPrice: null,
  maxPrice: null,
  isFiltersOpen: false,
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    toggleArrayFilter(
      state,
      action: PayloadAction<{ key: "types" | "brands" | "colorVariants"; value: string }>
    ) {
      const { key, value } = action.payload;
      const list = state[key];
      const idx = list.indexOf(value);
      if (idx === -1) list.push(value);
      else list.splice(idx, 1);
    },
    setRangeFilter(
      state,
      action: PayloadAction<{
        key: "minPrice" | "maxPrice";
        value: number | null;
      }>
    ) {
      state[action.payload.key] = action.payload.value;
    },
    setFiltersOpen(state, action: PayloadAction<boolean>) {
      state.isFiltersOpen = action.payload;
    },
    resetFilters() {
      return initialState;
    },
  },
});

export const {
  setSearch,
  toggleArrayFilter,
  setRangeFilter,
  setFiltersOpen,
  resetFilters,
} = catalogSlice.actions;

export default catalogSlice.reducer;
