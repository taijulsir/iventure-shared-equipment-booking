import { Alert } from "@/components/ui/Alert";
import { LoginForm } from "@/features/auth/LoginForm";
import styles from "../layout.module.css";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const justRegistered = params.registered === "true";

  return (
    <>
      <h1 className={styles.title}>Sign in</h1>
      {justRegistered && <Alert variant="success">Account created — please sign in.</Alert>}
      <LoginForm />
    </>
  );
}
