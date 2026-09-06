import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import calculatorReducer from "@/features/calculator/store/calculatorSlice";
import catalogReducer from "@/features/catalog/store/catalogSlice";
import authReducer from "@/features/auth/store/authSlice";
import { catalogApi } from "@/features/catalog/store/catalogApi";
import { stockApi } from "@/features/stock/store/stockApi";
import { authApi } from "@/features/auth/store/authApi";
import { itemsApi } from "@/features/items/store/itemsApi";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      calculator: calculatorReducer,
      catalog: catalogReducer,
      auth: authReducer,
      [catalogApi.reducerPath]: catalogApi.reducer,
      [stockApi.reducerPath]: stockApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [itemsApi.reducerPath]: itemsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        catalogApi.middleware,
        stockApi.middleware,
        authApi.middleware,
        itemsApi.middleware
      ),
  });
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
