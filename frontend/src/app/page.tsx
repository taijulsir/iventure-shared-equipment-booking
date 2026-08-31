import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/api/server-session";
import { Button } from "@/components/ui/Button";
import styles from "./page.module.css";

export default async function Home() {
  const user = await getServerSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.landing}>
      <h1 className={styles.title}>iVenture Shared Equipment Booking</h1>
      <p className={styles.subtitle}>
        Reserve shared company equipment like laptops, cameras, and projectors — sign in or
        create an account to get started.
      </p>
      <div className={styles.actions}>
        <Button href="/login" variant="primary">
          Sign in
        </Button>
        <Button href="/register" variant="secondary">
          Create account
        </Button>
      </div>
    </div>
  );
}

