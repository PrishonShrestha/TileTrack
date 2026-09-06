import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Stock,
  StockHistoryEntry,
  StockUpdatePayload,
  StockUpdateResponse,
} from "@/types/domain";

export const stockApi = createApi({
  reducerPath: "stockApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/sheets" }),
  tagTypes: ["Stock", "StockHistory", "Items"],
  keepUnusedDataFor: 30,
  endpoints: (builder) => ({
    getStock: builder.query<Stock[], void>({
      query: () => "/stock",
      transformResponse: (response: { stock: Stock[] }) => response.stock ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((s) => ({ type: "Stock" as const, id: s.productId || s.sku || "" })),
              { type: "Stock" as const, id: "LIST" },
            ]
          : [{ type: "Stock" as const, id: "LIST" }],
    }),
    getStockHistory: builder.query<StockHistoryEntry[], { productId?: string; sku?: string } | void>({
      query: (params) => {
        const search = new URLSearchParams();
        const id = params?.productId || params?.sku;
        if (id) {
          search.set("productId", id);
          search.set("sku", id);
        }
        const qs = search.toString();
        return `/stock/history${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (response: { history: StockHistoryEntry[] }) => response.history ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((entry) => ({
                type: "StockHistory" as const,
                id: `${entry.productId || entry.sku}-${entry.date}`,
              })),
              { type: "StockHistory" as const, id: "LIST" },
            ]
          : [{ type: "StockHistory" as const, id: "LIST" }],
    }),
    updateStock: builder.mutation<StockUpdateResponse, StockUpdatePayload>({
      query: (body) => ({
        url: "/stock",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Stock", id: arg.productId || arg.sku },
        { type: "Stock", id: "LIST" },
        { type: "StockHistory", id: "LIST" },
        { type: "Items", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetStockQuery,
  useGetStockHistoryQuery,
  useUpdateStockMutation,
} = stockApi;