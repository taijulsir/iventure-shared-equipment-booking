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
import styles from "./AuthForm.module.css";

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
      <div className={styles.formHeader}>
        <div className={styles.iconBadge}>
          <IconSparkles size={22} />
        </div>
        <h1 className={styles.title}>Create your account</h1>
        <p className={styles.subtitle}>Register as an employee to book company equipment</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
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

        <p className={styles.footer}>
          Already have an account? <Link href="/login">Sign in instead</Link>
        </p>
      </form>
    </div>
  );
}
