import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

/**
 * Foundation placeholder: proves the /admin route and its role guard exist
 * and work (see ./layout.tsx) without building the actual management UI
 * yet. Equipment CRUD and reservation approve/reject screens are a
 * dedicated Admin feature phase — the backend endpoints they'll call
 * already exist (POST/PATCH/DELETE /equipment, PATCH
 * /reservations/:id/approve|reject).
 */
export default function AdminPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Admin</h1>
      <Card>
        <p>This area is reserved for administrator tools, coming in a later phase:</p>
        <ul className={styles.list}>
          <li>Add, edit, and remove equipment</li>
          <li>Approve or reject pending reservations</li>
        </ul>
      </Card>
    </div>
  );
}
