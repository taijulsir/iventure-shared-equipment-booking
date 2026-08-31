import { Button } from "@/components/ui/Button";
import { IconBrandLogo, IconArrowRight } from "@/components/ui/Icons";

export default function NotFound() {
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
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--color-border-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.5rem",
        }}
      >
        <IconBrandLogo size={32} />
      </div>

      <span
        style={{
          fontSize: "0.875rem",
          fontWeight: 700,
          color: "var(--color-primary)",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        404 Error
      </span>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 800,
          color: "var(--foreground)",
          letterSpacing: "-0.02em",
          marginBottom: "0.75rem",
        }}
      >
        Page Not Found
      </h1>

      <p
        style={{
          color: "var(--foreground-muted)",
          maxWidth: "42ch",
          lineHeight: 1.5,
          fontSize: "0.9375rem",
          marginBottom: "2rem",
        }}
      >
        The page you are looking for does not exist or may have been moved.
      </p>

      <Button href="/" variant="primary" size="lg">
        <span>Return to Dashboard</span>
        <IconArrowRight size={18} />
      </Button>
    </div>
  );
}
