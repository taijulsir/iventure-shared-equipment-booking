"use client";

import { useState } from "react";
import type { AssignableRole, SafeUser } from "@/types/user";
import { updateUserRole } from "@/lib/api/users";
import { ApiError } from "@/lib/api/core";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconUser, IconAlertCircle } from "@/components/ui/Icons";
import { formatUtc } from "@/lib/format";
import { roleTone } from "./roleTone";
import styles from "./UsersTable.module.css";

/** The one role-change action available for a given row, if any. SUPERADMIN
 * rows get none — "Do not display actions that the backend will reject" —
 * since the backend rejects every role change targeting a SuperAdmin. */
function nextRoleFor(role: SafeUser["role"]): AssignableRole | null {
  if (role === "EMPLOYEE") return "ADMIN";
  if (role === "ADMIN") return "EMPLOYEE";
  return null;
}

function actionLabel(target: AssignableRole): string {
  return target === "ADMIN" ? "Promote to Admin" : "Demote to Employee";
}

type RowState = { mode: "idle" } | { mode: "confirming" } | { mode: "submitting" } | { mode: "error"; message: string };

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: {
  users: SafeUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const rowState = (id: string): RowState => rowStates[id] ?? { mode: "idle" };
  const setRowState = (id: string, state: RowState) =>
    setRowStates((prev) => ({ ...prev, [id]: state }));

  async function confirmRoleChange(user: SafeUser, target: AssignableRole) {
    setRowState(user.id, { mode: "submitting" });
    try {
      const updated = await updateUserRole(user.id, target);
      setUsers((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setRowState(user.id, { mode: "idle" });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
      setRowState(user.id, { mode: "error", message });
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
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelf={user.id === currentUserId}
                state={rowState(user.id)}
                onRequestChange={() => setRowState(user.id, { mode: "confirming" })}
                onCancel={() => setRowState(user.id, { mode: "idle" })}
                onConfirm={(target) => confirmRoleChange(user, target)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className={styles.mobileCardList}>
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            isSelf={user.id === currentUserId}
            state={rowState(user.id)}
            onRequestChange={() => setRowState(user.id, { mode: "confirming" })}
            onCancel={() => setRowState(user.id, { mode: "idle" })}
            onConfirm={(target) => confirmRoleChange(user, target)}
          />
        ))}
      </div>
    </>
  );
}

interface RowProps {
  user: SafeUser;
  isSelf: boolean;
  state: RowState;
  onRequestChange: () => void;
  onCancel: () => void;
  onConfirm: (target: AssignableRole) => void;
}

function RoleAction({ user, isSelf, state, onRequestChange, onCancel, onConfirm }: RowProps) {
  const target = nextRoleFor(user.role);

  if (isSelf || !target) {
    return (
      <Badge tone="neutral" showDot={false}>
        Protected
      </Badge>
    );
  }

  if (state.mode === "confirming") {
    return (
      <div className={styles.confirmGroup}>
        <span className={styles.confirmLabel}>{actionLabel(target)}?</span>
        <Button size="sm" variant="primary" onClick={() => onConfirm(target)}>
          Confirm
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant={target === "ADMIN" ? "primary" : "outline"}
      isLoading={state.mode === "submitting"}
      onClick={onRequestChange}
    >
      {actionLabel(target)}
    </Button>
  );
}

function RowError({ state }: { state: RowState }) {
  if (state.mode !== "error") return null;
  return (
    <div className={styles.rowError}>
      <IconAlertCircle size={13} />
      <span>{state.message}</span>
    </div>
  );
}

function UserRow(props: RowProps) {
  const { user } = props;
  return (
    <tr>
      <td>
        <div className={styles.nameCell}>
          <div className={styles.userIconBox}>
            <IconUser size={16} />
          </div>
          <span className={styles.userName}>{user.name}</span>
        </div>
      </td>
      <td className={styles.email}>{user.email}</td>
      <td>
        <Badge tone={roleTone(user.role)} showDot={false}>
          {user.role}
        </Badge>
      </td>
      <td className={styles.created}>{formatUtc(user.createdAt)}</td>
      <td>
        <RoleAction {...props} />
        <RowError state={props.state} />
      </td>
    </tr>
  );
}

function UserCard(props: RowProps) {
  const { user } = props;
  return (
    <div className={styles.mobileCard}>
      <div className={styles.mobileCardHeader}>
        <div className={styles.nameCell}>
          <div className={styles.userIconBox}>
            <IconUser size={16} />
          </div>
          <span className={styles.userName}>{user.name}</span>
        </div>
        <Badge tone={roleTone(user.role)} showDot={false}>
          {user.role}
        </Badge>
      </div>
      <p className={styles.email}>{user.email}</p>
      <div className={styles.mobileCardFooter}>
        <span className={styles.created}>Joined {formatUtc(user.createdAt)}</span>
        <RoleAction {...props} />
      </div>
      <RowError state={props.state} />
    </div>
  );
}
