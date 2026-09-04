import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Brand,
  Category,
  Product,
  ProductType,
  ColorVariant,
  CreateProductPayload,
  UpdateProductPayload,
  DeleteProductPayload,
} from "@/types/domain";

export const catalogApi = createApi({
  reducerPath: "catalogApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/sheets" }),
  tagTypes: ["Products", "Categories", "Brands", "Types", "ColorVariants", "Stock"],
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      transformResponse: (response: { products: Product[] }) => response.products ?? [],
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((p) => ({ type: "Products" as const, id: p.productId || p.sku || "" })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
    }),
    getCategories: builder.query<Category[], void>({
      query: () => "/categories",
      transformResponse: (response: { categories: Category[] }) => response.categories ?? [],
      providesTags: [{ type: "Categories", id: "LIST" }],
    }),
    getBrands: builder.query<Brand[], void>({
      query: () => "/brands",
      transformResponse: (response: { brands: Brand[] }) => response.brands ?? [],
      providesTags: [{ type: "Brands", id: "LIST" }],
    }),
    getTypes: builder.query<ProductType[], void>({
      query: () => "/types",
      transformResponse: (response: { types: ProductType[] }) => response.types ?? [],
      providesTags: [{ type: "Types", id: "LIST" }],
    }),
    getColorVariants: builder.query<ColorVariant[], void>({
      query: () => "/color-variants",
      transformResponse: (response: { colorVariants: ColorVariant[] }) => response.colorVariants ?? [],
      providesTags: [{ type: "ColorVariants", id: "LIST" }],
    }),
    createProduct: builder.mutation<{ product: Product }, CreateProductPayload>({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "Products", id: "LIST" },
        { type: "Brands", id: "LIST" },
        { type: "Types", id: "LIST" },
        { type: "ColorVariants", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),
    updateProduct: builder.mutation<{ product: Product }, UpdateProductPayload>({
      query: (body) => ({
        url: "/products",
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Products", id: arg.productId },
        { type: "Products", id: "LIST" },
        { type: "Brands", id: "LIST" },
        { type: "Types", id: "LIST" },
        { type: "ColorVariants", id: "LIST" },
      ],
    }),
    deleteProduct: builder.mutation<{ success: boolean; productId: string }, DeleteProductPayload>({
      query: ({ productId }) => ({
        url: `/products?productId=${encodeURIComponent(productId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Products", id: arg.productId },
        { type: "Products", id: "LIST" },
        { type: "Brands", id: "LIST" },
        { type: "Types", id: "LIST" },
        { type: "ColorVariants", id: "LIST" },
        { type: "Stock", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetBrandsQuery,
  useGetTypesQuery,
  useGetColorVariantsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = catalogApi;