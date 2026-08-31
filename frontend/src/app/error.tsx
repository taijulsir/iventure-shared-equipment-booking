"use client";

import { useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

/**
 * Root error boundary (Next.js file convention — must be a Client
 * Component). Catches unexpected rendering/data errors anywhere in the
 * tree that weren't already handled locally (API calls in pages already
 * catch `ApiError` and render an inline `<Alert>` instead of throwing).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally console-only: no error-reporting service is wired up
    // in this phase, and no internal detail is shown to the user below.
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem", maxWidth: "480px", margin: "0 auto" }}>
      <Alert variant="error">Something went wrong. Please try again.</Alert>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
