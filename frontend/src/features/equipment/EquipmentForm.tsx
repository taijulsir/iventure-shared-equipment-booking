"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resolveApiErrorMessage } from "@/lib/api/handleApiError";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Input } from "@/components/ui/Input";

export interface EquipmentFormValues {
  name: string;
  description: string;
  requiresApproval: boolean;
}

export function EquipmentForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initialValues?: Partial<EquipmentFormValues>;
  submitLabel: string;
  onSubmit: (values: EquipmentFormValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [requiresApproval, setRequiresApproval] = useState(initialValues?.requiresApproval ?? false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), requiresApproval });
    } catch (caught) {
      setError(resolveApiErrorMessage(caught, () => router.push("/login")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        maxLength={200}
        placeholder="e.g. Conference Room Camera"
        required
      />

      <Input
        label="Description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        maxLength={2000}
        placeholder="Optional details about this item"
      />

      <Checkbox
        label="Requires administrator approval"
        checked={requiresApproval}
        onChange={(event) => setRequiresApproval(event.target.checked)}
        helperText="When on, new reservations start as Pending instead of Confirmed"
      />

      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
