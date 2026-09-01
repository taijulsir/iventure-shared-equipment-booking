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
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <div className="w-full max-w-[460px] flex flex-col gap-6 bg-surface border border-border rounded-[var(--radius-xl)] p-8 shadow-md text-center items-center">
        <div className="w-12 h-12 rounded-full bg-danger-bg border border-danger-border text-danger flex items-center justify-center">
          <IconAlertCircle size={24} />
        </div>

        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Unexpected Application Error
          </h1>
          <p className="text-sm text-foreground-muted leading-[1.5]">
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
