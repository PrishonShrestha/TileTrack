import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import calculatorReducer from "@/features/calculator/store/calculatorSlice";
import catalogReducer from "@/features/catalog/store/catalogSlice";
import { catalogApi } from "@/features/catalog/store/catalogApi";
import { stockApi } from "@/features/stock/store/stockApi";

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      calculator: calculatorReducer,
      catalog: catalogReducer,
      [catalogApi.reducerPath]: catalogApi.reducer,
      [stockApi.reducerPath]: stockApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(catalogApi.middleware, stockApi.middleware),
  });
  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
