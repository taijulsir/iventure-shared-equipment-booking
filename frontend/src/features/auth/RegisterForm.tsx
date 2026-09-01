"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/core";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconSparkles } from "@/components/ui/Icons";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ name, email, password });
      router.push("/login?registered=true");
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
          <IconSparkles size={22} />
        </div>
        <h1 className="text-[1.375rem] font-bold text-foreground tracking-[-0.02em]">Create your account</h1>
        <p className="text-sm text-foreground-muted leading-[1.4]">Register as an employee to book company equipment</p>
      </div>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Full name"
          name="name"
          autoComplete="name"
          required
          maxLength={120}
          placeholder="Jane Doe"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <Input
          label="Work email"
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="jane@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          helperText="Must be at least 8 characters long"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} size="lg">
          Create account
        </Button>

        <p className="mt-4 pt-4 border-t border-border text-sm text-foreground-muted text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold ml-1 hover:text-primary-hover hover:underline transition-colors duration-150">
            Sign in instead
          </Link>
        </p>
      </form>
    </div>
  );
}
