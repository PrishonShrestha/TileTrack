import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Admin Login",
  description: "Sign in to manage inventory, catalog products, and sales records.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="w-full max-w-md p-6 space-y-4 rounded-xl border border-border/70 bg-card">
            <Skeleton className="h-12 w-12 rounded-full mx-auto" />
            <Skeleton className="h-6 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
