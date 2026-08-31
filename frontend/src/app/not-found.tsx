import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "3rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Page not found</h1>
      <p style={{ color: "var(--color-text-muted)" }}>The page you&apos;re looking for doesn&apos;t exist.</p>
      <Button href="/" variant="secondary">
        Go home
      </Button>
    </div>
  );
}

