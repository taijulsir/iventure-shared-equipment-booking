"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { EquipmentModal } from "./EquipmentModal";

export function AddEquipmentButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="primary" size="md" onClick={() => setIsOpen(true)}>
        <span>+ Add Equipment</span>
      </Button>

      {isOpen && (
        <EquipmentModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
