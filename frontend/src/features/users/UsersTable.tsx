"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AssignableRole, SafeUser } from "@/types/user";
import { updateUserRole } from "@/lib/api/users";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

type RowState = { mode: "idle" } | { mode: "confirming" } | { mode: "submitting" } | { mode: "error"; message: string };

export function UsersTable({
  users: initialUsers,
  currentUserId,
}: {
  users: SafeUser[];
  currentUserId: string;
}) {
  const router = useRouter();
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
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
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
      <div className="hidden sm:block w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tl-[var(--radius-md)] whitespace-nowrap">
                Name
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                Email
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                Role
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap">
                Created
              </th>
              <th className="text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border rounded-tr-[var(--radius-md)] whitespace-nowrap">
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
      <div className="sm:hidden flex flex-col gap-4">
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[0.8125rem] font-medium text-foreground-secondary">{actionLabel(target)}?</span>
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
    <div className="flex items-center gap-1.5 mt-2 text-danger text-[0.8125rem]">
      <IconAlertCircle size={13} />
      <span>{state.message}</span>
    </div>
  );
}

function UserRow(props: RowProps) {
  const { user } = props;
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
      <td className="p-4 border-b border-border text-foreground-secondary align-middle group-last:border-b-0">{user.email}</td>
      <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
        <Badge tone={roleTone(user.role)} showDot={false}>
          {user.role}
        </Badge>
      </td>
      <td className="p-4 border-b border-border text-foreground-secondary align-middle tabular-nums whitespace-nowrap group-last:border-b-0">
        {formatUtc(user.createdAt)}
      </td>
      <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
        <RoleAction {...props} />
        <RowError state={props.state} />
      </td>
    </tr>
  );
}

function UserCard(props: RowProps) {
  const { user } = props;
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
        <span className="text-[0.8125rem] text-foreground-secondary tabular-nums">Joined {formatUtc(user.createdAt)}</span>
        <RoleAction {...props} />
      </div>
      <RowError state={props.state} />
    </div>
  );
}
