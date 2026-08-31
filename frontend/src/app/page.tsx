import Link from "next/link";
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
        <Link href="/login">
          <Button variant="primary">Sign in</Button>
        </Link>
        <Link href="/register">
          <Button variant="secondary">Create account</Button>
        </Link>
      </div>
    </div>
  );
}
