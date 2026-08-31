import { RegisterForm } from "@/features/auth/RegisterForm";
import styles from "../layout.module.css";

export default function RegisterPage() {
  return (
    <>
      <h1 className={styles.title}>Create your account</h1>
      <RegisterForm />
    </>
  );
}
