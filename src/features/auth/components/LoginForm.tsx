"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/features/auth/store/authApi";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/manage";

  const [login, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    try {
      await login(data).unwrap();
      toast.success("Welcome back! Logged in successfully.");
      router.push(redirectTarget);
      router.refresh();
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string }; message?: string };
      const msg = apiErr?.data?.error || "Invalid username or password";
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <Card className="w-full max-w-md border-border/70 shadow-lg">
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight">Admin Login</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your admin credentials to access inventory, sales, and catalog management.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage ? (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-xs font-semibold">
              Username
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="admin"
                className="pl-9 text-sm"
                {...form.register("username")}
              />
            </div>
            {form.formState.errors.username ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.username.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9 text-sm"
                {...form.register("password")}
              />
            </div>
            {form.formState.errors.password ? (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
