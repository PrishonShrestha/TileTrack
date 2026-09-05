import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isHydrated: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  username: null,
  isHydrated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ username?: string | null }>
    ) => {
      state.isAuthenticated = true;
      state.username = action.payload.username ?? "admin";
      state.isHydrated = true;
    },
    clearCredentials: (state) => {
      state.isAuthenticated = false;
      state.username = null;
      state.isHydrated = true;
    },
    setHydrated: (state, action: PayloadAction<boolean>) => {
      state.isHydrated = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setHydrated } =
  authSlice.actions;
export default authSlice.reducer;
