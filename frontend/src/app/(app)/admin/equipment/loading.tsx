import { CenteredLoader } from "@/components/ui/CenteredLoader";

export default function AdminEquipmentLoading() {
  return (
    <CenteredLoader
      title="Loading equipment..."
      subtitle="Fetching the catalogue for management"
    />
  );
}
