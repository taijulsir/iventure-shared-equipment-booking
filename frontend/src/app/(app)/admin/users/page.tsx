import { getServerSession, getRequestCookieHeader } from "@/lib/api/server-session";
import { listUsers } from "@/lib/api/users";
import { ApiError } from "@/lib/api/core";
import type { SafeUser } from "@/types/user";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableContainer } from "@/components/ui/TableContainer";
import { UsersTable } from "@/features/users/UsersTable";

export default async function UserManagementPage() {
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
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="shrink-0">
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
      </div>

      {errorMessage ? (
        <Alert variant="error" title="Failed to load users">
          {errorMessage}
        </Alert>
      ) : (
        <TableContainer>
          <UsersTable users={users ?? []} currentUserId={currentUser.id} />
        </TableContainer>
      )}
    </div>
  );
}
