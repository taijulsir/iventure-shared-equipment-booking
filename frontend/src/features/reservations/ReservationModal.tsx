"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Equipment } from "@/types/equipment";
import type { Reservation } from "@/types/reservation";
import { listEquipment } from "@/lib/api/equipment";
import { createReservation } from "@/lib/api/reservations";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { datetimeLocalValueToUtcIso } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Spinner } from "@/components/ui/Spinner";

export interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEquipmentId?: string;
  equipmentList?: Equipment[];
  onSuccess?: (reservation: Reservation) => void;
}

export function ReservationModal({
  isOpen,
  onClose,
  initialEquipmentId,
  equipmentList: initialList,
  onSuccess,
}: ReservationModalProps) {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>(initialList ?? []);
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(isOpen && (!initialList || initialList.length === 0));
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (initialList && initialList.length > 0) return;

    let isMounted = true;
    listEquipment({ limit: 100 })
      .then((res) => {
        if (isMounted) {
          setEquipment(res.data);
          setIsLoadingEquipment(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFetchError(resolveApiErrorMessage(err, () => router.push("/login")));
          setIsLoadingEquipment(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, initialList, router]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Equipment Reservation"
      description="Select equipment and reserve your timeframe with UTC conflict validation."
      maxWidth="md"
    >
      {isLoadingEquipment ? (
        <div className="flex items-center justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : fetchError ? (
        <Alert variant="error" title="Failed to load equipment">
          {fetchError}
        </Alert>
      ) : (
        <ReservationModalForm
          key={initialEquipmentId ?? "new"}
          equipment={equipment}
          initialEquipmentId={initialEquipmentId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}

function ReservationModalForm({
  equipment,
  initialEquipmentId,
  onClose,
  onSuccess,
}: {
  equipment: Equipment[];
  initialEquipmentId?: string;
  onClose: () => void;
  onSuccess?: (reservation: Reservation) => void;
}) {
  const router = useRouter();
  const [equipmentId, setEquipmentId] = useState(
    initialEquipmentId && equipment.some((item) => item.id === initialEquipmentId)
      ? initialEquipmentId
      : (equipment[0]?.id ?? "")
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = equipment.find((item) => item.id === equipmentId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!equipmentId) {
      setError("Please select an equipment item.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start time and end time are both required.");
      return;
    }

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();
    if (startMs >= endMs) {
      setError("End time must be strictly after start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reservation = await createReservation({
        equipmentId,
        startTime: datetimeLocalValueToUtcIso(startTime),
        endTime: datetimeLocalValueToUtcIso(endTime),
      });

      if (onSuccess) {
        onSuccess(reservation);
      }
      onClose();
      router.refresh();
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, () => router.push("/login")));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (equipment.length === 0) {
    return (
      <Alert variant="info" title="No equipment available">
        There are no items in the catalogue yet. Please contact an administrator.
      </Alert>
    );
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Select
        label="Equipment Item"
        options={equipment.map((item) => ({ label: item.name, value: item.id }))}
        value={equipmentId}
        onChange={(event) => setEquipmentId(event.target.value)}
        required
      />

      {selectedItem && (
        <div className="p-3 bg-surface-muted rounded-[var(--radius-sm)] border border-border text-xs leading-relaxed text-foreground-secondary -mt-1">
          <span className="font-semibold text-foreground">Policy: </span>
          {selectedItem.requiresApproval
            ? "This high-demand item requires administrator approval (created as Pending)."
            : "This standard item supports instant booking (confirmed immediately)."}
        </div>
      )}

      <Input
        label="Start Time (UTC)"
        type="datetime-local"
        value={startTime}
        onChange={(event) => setStartTime(event.target.value)}
        helperText="Recorded in UTC timezone"
        required
      />

      <Input
        label="End Time (UTC)"
        type="datetime-local"
        value={endTime}
        onChange={(event) => setEndTime(event.target.value)}
        helperText="Must be after the start time"
        required
      />

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
        >
          Reserve Equipment
        </Button>
      </div>
    </form>
  );
}
