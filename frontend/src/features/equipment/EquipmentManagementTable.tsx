"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Equipment } from "@/types/equipment";
import { createEquipment, deleteEquipment, updateEquipment } from "@/lib/api/equipment";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconEquipment, IconAlertCircle } from "@/components/ui/Icons";
import { EquipmentForm, type EquipmentFormValues } from "./EquipmentForm";
import styles from "./EquipmentManagementTable.module.css";

type RowState = { mode: "idle" } | { mode: "editing" } | { mode: "deleting" } | { mode: "error"; message: string };

export function EquipmentManagementTable({ equipment: initialEquipment }: { equipment: Equipment[] }) {
  const router = useRouter();
  const [equipment, setEquipment] = useState(initialEquipment);
  const [isCreating, setIsCreating] = useState(false);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});

  const rowState = (id: string): RowState => rowStates[id] ?? { mode: "idle" };
  const setRowState = (id: string, state: RowState) =>
    setRowStates((prev) => ({ ...prev, [id]: state }));

  async function handleCreate(values: EquipmentFormValues) {
    const created = await createEquipment({
      name: values.name,
      description: values.description || undefined,
      requiresApproval: values.requiresApproval,
    });
    setEquipment((prev) => [created, ...prev]);
    setIsCreating(false);
  }

  async function handleUpdate(item: Equipment, values: EquipmentFormValues) {
    const updated = await updateEquipment(item.id, {
      name: values.name,
      description: values.description,
      requiresApproval: values.requiresApproval,
    });
    setEquipment((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    setRowState(item.id, { mode: "idle" });
  }

  async function handleDelete(item: Equipment) {
    setRowState(item.id, { mode: "deleting" });
    try {
      await deleteEquipment(item.id);
      setEquipment((prev) => prev.filter((row) => row.id !== item.id));
    } catch (error) {
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
      setRowState(item.id, { mode: "error", message });
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.createSection}>
        {isCreating ? (
          <Card className={styles.createCard}>
            <h2 className={styles.createTitle}>New Equipment</h2>
            <EquipmentForm submitLabel="Create" onSubmit={handleCreate} onCancel={() => setIsCreating(false)} />
          </Card>
        ) : (
          <Button variant="primary" onClick={() => setIsCreating(true)}>
            Add Equipment
          </Button>
        )}
      </div>

      {equipment.length === 0 ? (
        <EmptyState
          icon={<IconEquipment size={28} />}
          title="No equipment yet"
          description="Add the first catalogue item using the button above."
        />
      ) : (
        <div className={styles.list}>
          {equipment.map((item) => {
            const state = rowState(item.id);

            if (state.mode === "editing") {
              return (
                <Card key={item.id} className={styles.editCard}>
                  <EquipmentForm
                    initialValues={{
                      name: item.name,
                      description: item.description ?? "",
                      requiresApproval: item.requiresApproval,
                    }}
                    submitLabel="Save changes"
                    onSubmit={(values) => handleUpdate(item, values)}
                    onCancel={() => setRowState(item.id, { mode: "idle" })}
                  />
                </Card>
              );
            }

            return (
              <Card key={item.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <div className={styles.itemIconBox}>
                    <IconEquipment size={18} />
                  </div>
                  <div className={styles.rowText}>
                    <span className={styles.itemName}>{item.name}</span>
                    <span className={styles.itemDescription}>{item.description || "No description"}</span>
                  </div>
                  {item.requiresApproval ? (
                    <Badge tone="warning">Requires approval</Badge>
                  ) : (
                    <Badge tone="success">Instant booking</Badge>
                  )}
                </div>

                <div className={styles.rowActions}>
                  {state.mode === "deleting" ? (
                    <div className={styles.confirmGroup}>
                      <span className={styles.confirmLabel}>Delete this item?</span>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(item)}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRowState(item.id, { mode: "idle" })}>
                        Dismiss
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setRowState(item.id, { mode: "editing" })}>
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setRowState(item.id, { mode: "deleting" })}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>

                {state.mode === "error" && (
                  <div className={styles.rowError}>
                    <IconAlertCircle size={13} />
                    <span>{state.message}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
