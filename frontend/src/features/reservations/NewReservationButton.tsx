"use client";

import { useState } from "react";
import type { Equipment } from "@/types/equipment";
import { Button } from "@/components/ui/Button";
import { ReservationModal } from "./ReservationModal";

export function NewReservationButton({
  equipmentList,
}: {
  equipmentList?: Equipment[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={() => setIsOpen(true)}
      >
        <span className="text-white">+ New Reservation</span>
      </Button>

      {isOpen && (
        <ReservationModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          equipmentList={equipmentList}
        />
      )}
    </>
  );
}
