"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/core";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconUser } from "@/components/ui/Icons";

export function LoginForm({ initialSuccess }: { initialSuccess?: string | null }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      router.replace("/dashboard");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-6 gap-1">
        <div className="w-11 h-11 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center mb-3">
          <IconUser size={22} />
        </div>
        <h1 className="text-[1.375rem] font-bold text-foreground tracking-[-0.02em]">Sign in to your account</h1>
        <p className="text-sm text-foreground-muted leading-[1.4]">Enter your company credentials to manage equipment</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {initialSuccess && <Alert variant="success">{initialSuccess}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} size="lg">
          Sign in
        </Button>

        <p className="mt-4 pt-4 border-t border-border text-sm text-foreground-muted text-center">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary font-semibold ml-1 hover:text-primary-hover hover:underline transition-colors duration-150">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
