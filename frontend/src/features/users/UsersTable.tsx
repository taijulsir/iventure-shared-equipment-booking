"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssignableRole, SafeUser } from "@/types/user";
import { updateUserRole } from "@/lib/api/users";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconUser, IconAlertCircle } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";
import { roleTone } from "./roleTone";

function nextRoleFor(role: SafeUser["role"]): AssignableRole | null {
  if (role === "EMPLOYEE") return "ADMIN";
  if (role === "ADMIN") return "EMPLOYEE";
  return null;
}

function actionLabel(target: AssignableRole): string {
  return target === "ADMIN" ? "Promote to Admin" : "Demote to Employee";
}

interface PendingAction {
  user: SafeUser;
  targetRole: AssignableRole;
}

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: {
  users: SafeUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  async function handleConfirmRoleChange() {
    if (!pendingAction) return;
    const { user, targetRole } = pendingAction;

    setIsSubmitting(true);
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    try {
      const updated = await updateUserRole(user.id, targetRole);
      setUsers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setPendingAction(null);
    } catch (error) {
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
      setRowErrors((prev) => ({ ...prev, [user.id]: message }));
      setPendingAction(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<IconUser size={28} />}
        title="No user accounts yet"
        description="Employee accounts created through registration will appear here."
      />
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden sm:block w-full">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Name
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Email
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Role
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Created
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                errorMessage={rowErrors[user.id]}
                onRequestChange={(targetRole) => setPendingAction({ user, targetRole })}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden flex flex-col gap-4 p-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            errorMessage={rowErrors[user.id]}
            onRequestChange={(targetRole) => setPendingAction({ user, targetRole })}
          />
        ))}
      </div>

      {/* Reusable Confirmation Modal */}
      {pendingAction && (
        <ConfirmationModal
          isOpen={Boolean(pendingAction)}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmRoleChange}
          isLoading={isSubmitting}
          confirmVariant={pendingAction.targetRole === "ADMIN" ? "primary" : "danger"}
          confirmLabel={actionLabel(pendingAction.targetRole)}
          title={
            pendingAction.targetRole === "ADMIN"
              ? `Promote ${pendingAction.user.name} to Administrator?`
              : `Demote ${pendingAction.user.name} to Employee?`
          }
          description={
            pendingAction.targetRole === "ADMIN" ? (
              <span>
                Are you sure you want to promote <strong>{pendingAction.user.name}</strong> ({pendingAction.user.email}) to an <strong>Administrator</strong>? Administrators can manage equipment catalogue items and review reservation approval workflows.
              </span>
            ) : (
              <span>
                Are you sure you want to demote <strong>{pendingAction.user.name}</strong> ({pendingAction.user.email}) to an <strong>Employee</strong>? This will revoke administrator privileges for equipment management and approval actions.
              </span>
            )
          }
        />
      )}
    </>
  );
}

interface RowProps {
  user: SafeUser;
  isSelf: boolean;
  errorMessage?: string;
  onRequestChange: (target: AssignableRole) => void;
}

function RoleActionButton({ user, isSelf, onRequestChange }: RowProps) {
  const target = nextRoleFor(user.role);

  if (isSelf || !target) {
    return (
      <Badge tone="neutral" showDot={false}>
        Protected
      </Badge>
    );
  }

  return (
    <Button
      size="sm"
      variant={target === "ADMIN" ? "primary" : "secondary"}
      onClick={() => onRequestChange(target)}
    >
      {actionLabel(target)}
    </Button>
  );
}

function UserRow(props: RowProps) {
  const { user, errorMessage } = props;
  return (
    <tr className="group hover:bg-surface-subtle transition-colors duration-150">
      <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
            <IconUser size={16} />
          </div>
          <span className="font-semibold text-foreground">{user.name}</span>
        </div>
      </td>
      <td className="p-4 border-b border-border text-foreground-secondary align-middle group-last:border-b-0">
        {user.email}
      </td>
      <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
        <Badge tone={roleTone(user.role)} showDot={false}>
          {user.role}
        </Badge>
      </td>
      <td className="p-4 border-b border-border text-foreground-secondary align-middle tabular-nums whitespace-nowrap group-last:border-b-0">
        {formatUtc(user.createdAt)}
      </td>
      <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
        <RoleActionButton {...props} />
        {errorMessage && (
          <div className="flex items-center gap-1.5 mt-2 text-danger text-[0.8125rem]">
            <IconAlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        )}
      </td>
    </tr>
  );
}

function UserCard(props: RowProps) {
  const { user, errorMessage } = props;
  return (
    <div className="bg-surface border border-border rounded-[var(--radius-md)] p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
            <IconUser size={16} />
          </div>
          <span className="font-semibold text-foreground">{user.name}</span>
        </div>
        <Badge tone={roleTone(user.role)} showDot={false}>
          {user.role}
        </Badge>
      </div>
      <p className="text-foreground-secondary text-sm">{user.email}</p>
      <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-border">
        <span className="text-[0.8125rem] text-foreground-secondary tabular-nums">
          Joined {formatUtc(user.createdAt)}
        </span>
        <RoleActionButton {...props} />
      </div>
      {errorMessage && (
        <div className="flex items-center gap-1.5 text-danger text-[0.8125rem]">
          <IconAlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
