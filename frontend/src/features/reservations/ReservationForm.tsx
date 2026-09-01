"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Equipment } from "@/types/equipment";
import { createReservation } from "@/lib/api/reservations";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { datetimeLocalValueToUtcIso } from "@/lib/format";
import styles from "./ReservationForm.module.css";

export function ReservationForm({
  equipment,
  initialEquipmentId,
}: {
  equipment: Equipment[];
  initialEquipmentId?: string;
}) {
  const router = useRouter();
  const [equipmentId, setEquipmentId] = useState(
    initialEquipmentId && equipment.some((item) => item.id === initialEquipmentId)
      ? initialEquipmentId
      : (equipment[0]?.id ?? ""),
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEquipment = equipment.find((item) => item.id === equipmentId);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!equipmentId) {
      setError("Select an equipment item.");
      return;
    }
    if (!startTime || !endTime) {
      setError("Start and end time are both required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reservation = await createReservation({
        equipmentId,
        startTime: datetimeLocalValueToUtcIso(startTime),
        endTime: datetimeLocalValueToUtcIso(endTime),
      });
      router.push(`/reservations/${reservation.id}`);
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, () => router.push("/login")));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (equipment.length === 0) {
    return (
      <Alert variant="info" title="No equipment available">
        There is no equipment in the catalogue yet — check back once an administrator adds some.
      </Alert>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Select
        label="Equipment"
        options={equipment.map((item) => ({ label: item.name, value: item.id }))}
        value={equipmentId}
        onChange={(event) => setEquipmentId(event.target.value)}
        required
      />

      {selectedEquipment && (
        <p className={styles.policyNote}>
          {selectedEquipment.requiresApproval
            ? "This item requires administrator approval — your reservation will start as Pending."
            : "This item is instant-booking — your reservation will be Confirmed immediately."}
        </p>
      )}

      <Input
        label="Start time (UTC)"
        type="datetime-local"
        value={startTime}
        onChange={(event) => setStartTime(event.target.value)}
        helperText="Enter the time in UTC, not your local timezone"
        required
      />

      <Input
        label="End time (UTC)"
        type="datetime-local"
        value={endTime}
        onChange={(event) => setEndTime(event.target.value)}
        helperText="Must be after the start time"
        required
      />

      <Button type="submit" variant="primary" fullWidth isLoading={isSubmitting} size="lg">
        Create reservation
      </Button>
    </form>
  );
}
