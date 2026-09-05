"use client";

import { useGetSessionQuery } from "@/features/auth/store/authApi";

export function AuthInitializer() {
  useGetSessionQuery();
  return null;
}
