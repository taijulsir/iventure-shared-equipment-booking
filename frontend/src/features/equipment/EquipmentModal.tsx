"use client";

import type { Equipment } from "@/types/equipment";
import { createEquipment, updateEquipment } from "@/lib/api/equipment";
import { Modal } from "@/components/ui/Modal";
import { EquipmentForm, type EquipmentFormValues } from "./EquipmentForm";

export interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment?: Equipment | null;
  onSuccess: (item: Equipment) => void;
}

export function EquipmentModal({
  isOpen,
  onClose,
  equipment,
  onSuccess,
}: EquipmentModalProps) {
  const isEditing = Boolean(equipment);

  async function handleSubmit(values: EquipmentFormValues) {
    if (isEditing && equipment) {
      const updated = await updateEquipment(equipment.id, {
        name: values.name,
        description: values.description || undefined,
        requiresApproval: values.requiresApproval,
      });
      onSuccess(updated);
    } else {
      const created = await createEquipment({
        name: values.name,
        description: values.description || undefined,
        requiresApproval: values.requiresApproval,
      });
      onSuccess(created);
    }
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit: ${equipment?.name}` : "Add New Equipment"}
      description={
        isEditing
          ? "Update equipment specifications and booking approval rules."
          : "Provision a new equipment asset into the shared catalogue."
      }
      maxWidth="md"
    >
      <EquipmentForm
        key={equipment ? equipment.id : "new"}
        initialValues={{
          name: equipment?.name ?? "",
          description: equipment?.description ?? "",
          requiresApproval: equipment?.requiresApproval ?? false,
        }}
        submitLabel={isEditing ? "Save changes" : "Create Equipment"}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}
