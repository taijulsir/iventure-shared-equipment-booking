"use client";

import { useState } from "react";
import type { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/Button";
import { ReservationModal } from "@/features/reservations/ReservationModal";

export function BookEquipmentButton({ equipment }: { equipment: Equipment }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        onClick={() => setIsOpen(true)}
      >
        <span>Book this equipment</span>
      </Button>

      {isOpen && (
        <ReservationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          initialEquipmentId={equipment.id}
          equipmentList={[equipment]}
        />
      )}
    </>
  );
}
