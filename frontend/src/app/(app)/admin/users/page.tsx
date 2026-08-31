import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/core";
import type { SafeUser } from "@/types/user";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { UsersTable } from "@/features/users/UsersTable";
import styles from "./page.module.css";

export default async function UserManagementPage() {
  // Guaranteed non-null and SUPERADMIN by admin/users/layout.tsx, which runs
  // first — re-reading it here just avoids a second network round trip.
  const currentUser = (await getServerSession())!;
  const cookieHeader = await getRequestCookieHeader();

  let users: SafeUser[] | null = null;
  let errorMessage: string | null = null;

  try {
    users = await listUsers(cookieHeader);
  } catch (error) {
    errorMessage =
      error instanceof ApiError ? error.message : "Something went wrong loading the user list.";
  }

  const count = users ? users.length : 0;

  return (
    <div className={styles.page}>
      <PageHeader
        title="User Management"
        subtitle="Review every account and manage Employee/Administrator role assignments."
        badge={
          users && (
            <Badge tone="neutral" showDot={false}>
              {count} {count === 1 ? "User" : "Users"}
            </Badge>
          )
        }
      />

      {errorMessage ? (
        <Alert variant="error" title="Failed to load users">
          {errorMessage}
        </Alert>
      ) : (
        <div className={styles.tableCard}>
          <UsersTable users={users ?? []} currentUserId={currentUser.id} />
        </div>
      )}
    </div>
  );
}
