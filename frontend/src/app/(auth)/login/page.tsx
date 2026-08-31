import { LoginForm } from "@/features/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  const justRegistered = params.registered === "true";

  return <LoginForm initialSuccess={justRegistered ? "Account created successfully — please sign in." : null} />;
}
