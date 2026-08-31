"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/core";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import styles from "./AuthForm.module.css";

export function LoginForm() {
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
      // Full navigation to a route the (app) layout will render fresh,
      // reading the just-set auth cookie server-side.
      router.replace("/dashboard");
    } catch (caught) {
      // The backend intentionally returns the same generic message whether
      // the email or the password was wrong (docs/decisions.md) — shown
      // verbatim, not reinterpreted, so the frontend doesn't accidentally
      // leak a distinction the backend deliberately hides.
      setError(caught instanceof ApiError ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Input
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button type="submit" fullWidth isLoading={isSubmitting}>
        Sign in
      </Button>

      <p className={styles.footer}>
        Don&apos;t have an account? <Link href="/register">Create one</Link>
      </p>
    </form>
  );
}
