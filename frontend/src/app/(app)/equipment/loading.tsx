import { CenteredLoader } from "@/components/ui/CenteredLoader";

export default function EquipmentLoading() {
  return (
    <CenteredLoader
      title="Loading equipment catalogue..."
      subtitle="Fetching available inventory and booking policies"
    />
  );
}
