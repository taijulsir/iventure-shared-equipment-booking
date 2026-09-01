"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Equipment, EquipmentWithAvailability } from "@/types/equipment";
import { deleteEquipment } from "@/lib/api/equipment";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconEquipment, IconEdit, IconTrash, IconCalendar, IconAlertCircle } from "@/components/ui/Icons";
import { EquipmentModal } from "./EquipmentModal";
import { ReservationModal } from "@/features/reservations/ReservationModal";

function AvailabilityBadge({ available }: { available: boolean | null }) {
  if (available === null) return null;
  return available ? (
    <Badge tone="success" showDot={false}>Available</Badge>
  ) : (
    <Badge tone="danger" showDot={false}>Booked</Badge>
  );
}

export function EquipmentTable({
  equipment: initialEquipment,
  showBookAction = false,
  isAdmin = false,
}: {
  equipment: EquipmentWithAvailability[];
  showBookAction?: boolean;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [equipmentList, setEquipmentList] = useState(initialEquipment);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<Equipment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bookingItemId, setBookingItemId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Sync if parent prop changes
  if (initialEquipment !== equipmentList && initialEquipment.length !== equipmentList.length) {
    setEquipmentList(initialEquipment);
  }

  function handleEditClick(item: Equipment) {
    setEditingItem(item);
    setIsEditModalOpen(true);
  }

  function handleEditSuccess(updated: Equipment) {
    setEquipmentList((prev) =>
      prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
    );
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deletingItem) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteEquipment(deletingItem.id);
      setEquipmentList((prev) => prev.filter((item) => item.id !== deletingItem.id));
      setDeletingItem(null);
      router.refresh();
    } catch (error) {
      const message = resolveApiErrorMessage(error, () => router.push("/login"));
      setActionError(message);
      setDeletingItem(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (equipmentList.length === 0) {
    return (
      <EmptyState
        icon={<IconEquipment size={28} />}
        title="No equipment catalogue entries yet"
        description="Once an administrator provisions inventory items, they will appear here for reservation."
      />
    );
  }

  return (
    <>
      {actionError && (
        <div className="p-4 bg-danger-bg border-b border-danger-border flex items-center gap-2 text-danger text-sm font-medium">
          <IconAlertCircle size={16} className="shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden sm:block w-full">
        <table className="w-full border-collapse text-sm text-left">
          <thead>
            <tr>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Equipment Item
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Description
              </th>
              <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                Booking Policy
              </th>
              {(showBookAction || isAdmin) && (
                <th className="sticky top-0 z-20 text-xs font-semibold uppercase tracking-[0.05em] text-foreground-muted px-4 py-3 bg-surface-muted border-b border-border whitespace-nowrap shadow-[0_1px_0_var(--border)]">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {equipmentList.map((item) => {
              const displayDescription = item.description?.trim() ? item.description : "N/A";

              return (
                <tr key={item.id} className="group hover:bg-surface-subtle transition-colors duration-150">
                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <Link href={`/equipment/${item.id}`} className="flex items-center gap-3 w-fit group/link">
                      <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                        <IconEquipment size={18} />
                      </div>
                      <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                        {item.name}
                      </span>
                    </Link>
                  </td>

                  <td className="p-4 border-b border-border text-foreground-secondary align-middle max-w-[44ch] leading-[1.45] group-last:border-b-0">
                    {displayDescription}
                  </td>

                  <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.requiresApproval ? (
                        <Badge tone="warning">Requires approval</Badge>
                      ) : (
                        <Badge tone="success">Instant booking</Badge>
                      )}
                      <AvailabilityBadge available={item.available} />
                    </div>
                  </td>

                  {(showBookAction || isAdmin) && (
                    <td className="p-4 border-b border-border text-foreground align-middle group-last:border-b-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAdmin && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleEditClick(item)}
                              aria-label={`Edit ${item.name}`}
                            >
                              <IconEdit size={14} />
                              <span>Edit</span>
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => setDeletingItem(item)}
                              aria-label={`Delete ${item.name}`}
                            >
                              <IconTrash size={14} />
                              <span>Delete</span>
                            </Button>
                          </>
                        )}
                        {showBookAction && (
                          <button
                            type="button"
                            title={`Book ${item.name}`}
                            aria-label={`Book ${item.name}`}
                            onClick={() => setBookingItemId(item.id)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-[var(--radius-sm)] border border-border bg-surface text-primary hover:bg-primary-subtle hover:border-primary cursor-pointer transition-all duration-150 shadow-xs"
                          >
                            <IconCalendar size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="sm:hidden flex flex-col gap-4 p-4">
        {equipmentList.map((item) => {
          const displayDescription = item.description?.trim() ? item.description : "N/A";

          return (
            <div key={item.id} className="bg-surface border border-border rounded-[var(--radius-md)] p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/equipment/${item.id}`} className="flex items-center gap-3 w-fit group/link">
                  <div className="w-9 h-9 rounded-[var(--radius-md)] bg-surface-subtle border border-border-accent text-primary flex items-center justify-center shrink-0">
                    <IconEquipment size={18} />
                  </div>
                  <span className="font-semibold text-foreground group-hover/link:text-primary transition-colors duration-150">
                    {item.name}
                  </span>
                </Link>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {item.requiresApproval ? (
                    <Badge tone="warning">Approval</Badge>
                  ) : (
                    <Badge tone="success">Instant</Badge>
                  )}
                  <AvailabilityBadge available={item.available} />
                </div>
              </div>

              <div className="text-sm text-foreground-secondary leading-[1.45]">
                <span className="font-medium text-foreground-muted mr-1">Description:</span>
                {displayDescription}
              </div>

              {(showBookAction || isAdmin) && (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border flex-wrap">
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditClick(item)}
                      >
                        <IconEdit size={14} />
                        <span>Edit</span>
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => setDeletingItem(item)}
                      >
                        <IconTrash size={14} />
                        <span>Delete</span>
                      </Button>
                    </div>
                  )}
                  {showBookAction && (
                    <button
                      type="button"
                      title={`Book ${item.name}`}
                      aria-label={`Book ${item.name}`}
                      onClick={() => setBookingItemId(item.id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-border bg-surface text-primary hover:bg-primary-subtle hover:border-primary text-xs font-semibold cursor-pointer transition-all duration-150 shadow-xs"
                    >
                      <IconCalendar size={15} />
                      <span>Book Item</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Equipment Modal */}
      {isEditModalOpen && (
        <EquipmentModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          equipment={editingItem}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingItem && (
        <ConfirmationModal
          isOpen={Boolean(deletingItem)}
          onClose={() => setDeletingItem(null)}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          confirmVariant="danger"
          confirmLabel="Delete Item"
          title={`Delete ${deletingItem.name}?`}
          description={
            <span>
              Are you sure you want to delete <strong>{deletingItem.name}</strong> from the shared catalogue? This action cannot be undone.
            </span>
          }
        />
      )}

      {/* In-place Booking Modal */}
      {bookingItemId && (
        <ReservationModal
          isOpen={Boolean(bookingItemId)}
          onClose={() => setBookingItemId(null)}
          initialEquipmentId={bookingItemId}
          equipmentList={equipmentList}
        />
      )}
    </>
  );
}
