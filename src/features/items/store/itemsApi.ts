import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Item,
  ItemCategory,
  CreateItemPayload,
  UpdateItemPayload,
  DeleteItemPayload,
} from "@/types/domain";

export const itemsApi = createApi({
  reducerPath: "itemsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/sheets" }),
  tagTypes: ["Items", "ItemCategories", "Stock"],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getItems: builder.query<Item[], void>({
      query: () => "/items",
      transformResponse: (response: { items: Item[] }) => response.items ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((i) => ({ type: "Items" as const, id: i.itemId })),
              { type: "Items" as const, id: "LIST" },
            ]
          : [{ type: "Items" as const, id: "LIST" }],
    }),
    getItemCategories: builder.query<ItemCategory[], void>({
      query: () => "/item-categories",
      transformResponse: (response: { itemCategories: ItemCategory[] }) =>
        response.itemCategories ?? [],
      providesTags: [{ type: "ItemCategories", id: "LIST" }],
    }),
    createItem: builder.mutation<{ item: Item }, CreateItemPayload>({
      query: (body) => ({
        url: "/items",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Items", id: "LIST" },
        { type: "ItemCategories", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),
    updateItem: builder.mutation<{ item: Item }, UpdateItemPayload>({
      query: (body) => ({
        url: "/items",
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Items", id: arg.itemId },
        { type: "Items", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),
    deleteItem: builder.mutation<{ success: boolean; itemId: string }, DeleteItemPayload>({
      query: ({ itemId }) => ({
        url: `/items?itemId=${encodeURIComponent(itemId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Items", id: arg.itemId },
        { type: "Items", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetItemsQuery,
  useGetItemCategoriesQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
} = itemsApi;
