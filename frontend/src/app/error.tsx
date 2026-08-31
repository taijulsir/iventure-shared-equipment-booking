"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { IconAlertCircle } from "@/components/ui/Icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        backgroundColor: "var(--background)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "2rem",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "var(--radius-full)",
            backgroundColor: "var(--color-danger-bg)",
            border: "1px solid var(--color-danger-border)",
            color: "var(--color-danger)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconAlertCircle size={24} />
        </div>

        <div>
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: "0.5rem",
            }}
          >
            Unexpected Application Error
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--foreground-muted)",
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred while rendering this page. You can try refreshing or clicking below.
          </p>
        </div>

        <Alert variant="error">Something went wrong. Please try again.</Alert>

        <Button onClick={reset} variant="primary" fullWidth size="lg">
          Try again
        </Button>
      </div>
    </div>
  );
}
