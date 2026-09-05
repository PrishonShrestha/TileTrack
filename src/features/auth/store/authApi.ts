import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, clearCredentials } from "./authSlice";

export interface LoginPayload {
  username: string;
  password: string;
}

export interface SessionResponse {
  authenticated: boolean;
  username?: string;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/auth" }),
  tagTypes: ["Session"],
  endpoints: (builder) => ({
    getSession: builder.query<SessionResponse, void>({
      query: () => "/session",
      providesTags: ["Session"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.authenticated) {
            dispatch(setCredentials({ username: data.username }));
          } else {
            dispatch(clearCredentials());
          }
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
    login: builder.mutation<SessionResponse, LoginPayload>({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: credentials,
      }),
      invalidatesTags: ["Session"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.authenticated) {
            dispatch(setCredentials({ username: data.username }));
          }
        } catch {
          // handled in component
        }
      },
    }),
    logout: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: "/logout",
        method: "POST",
      }),
      invalidatesTags: ["Session"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
  }),
});

export const {
  useGetSessionQuery,
  useLoginMutation,
  useLogoutMutation,
} = authApi;
